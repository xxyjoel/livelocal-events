/**
 * Common utilities for the venue website scraper.
 *
 * Shared types and event normalization following the same pattern
 * as facebook-common.ts.
 */

import { createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { normalizeTags } from "@/lib/sync/tag-normalizer";
import {
  mapFacebookCategory,
  extractFacebookTags,
} from "@/lib/sync/facebook-common";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw event data extracted from a venue website. */
export interface RawWebsiteEvent {
  title: string;
  description?: string;
  startDate: string; // ISO 8601
  endDate?: string;
  imageUrl?: string;
  ticketUrl?: string;
  sourceUrl: string;
}

/** Result stats for a venue website sync run. */
export interface WebsiteSyncResult {
  eventsCreated: number;
  eventsUpdated: number;
  venuesProcessed: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Deterministic external ID
// ---------------------------------------------------------------------------

/**
 * Create a deterministic dedup key from venue slug + title + startDate.
 * Uses SHA-256, truncated to 16 hex chars.
 */
function createExternalId(
  venueSlug: string,
  title: string,
  startDate: string
): string {
  const input = `${venueSlug}|${title}|${startDate}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

// ---------------------------------------------------------------------------
// Event normalization + upsert
// ---------------------------------------------------------------------------

/**
 * Normalize a raw website event and upsert it into the database.
 *
 * Returns whether the event was created, updated, or skipped.
 */
export async function normalizeWebsiteEvent(
  raw: RawWebsiteEvent,
  venueId: string,
  venueName: string
): Promise<"created" | "updated" | "skipped"> {
  // Parse dates
  const startDate = new Date(raw.startDate);
  if (isNaN(startDate.getTime())) return "skipped";

  // Only process future events
  if (startDate < new Date()) return "skipped";

  const endDate = raw.endDate ? new Date(raw.endDate) : null;

  // Category (reuse Facebook keyword matching)
  const categoryId = await mapFacebookCategory(
    raw.title,
    raw.description
  );

  // Tags (reuse Facebook keyword extraction + normalization)
  const tags = extractFacebookTags(raw.title, raw.description);

  // Deterministic external ID for dedup
  const venueSlug = slugify(venueName);
  const externalId = createExternalId(venueSlug, raw.title, raw.startDate);

  // Check for existing event by external source + ID
  const existing = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.externalSource, "venue_website"),
        eq(events.externalId, externalId)
      )
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(events)
      .set({
        title: raw.title,
        description: raw.description ?? null,
        startDate,
        endDate,
        venueId,
        categoryId,
        imageUrl: raw.imageUrl ?? null,
        tags,
        externalUrl: raw.sourceUrl,
        updatedAt: new Date(),
      })
      .where(eq(events.id, existing[0].id));

    return "updated";
  }

  // Create new event
  const id = createId();
  const baseSlug = slugify(`${raw.title} ${venueName}`);
  const slug = `${baseSlug}-${id.slice(0, 6)}`;

  await db.insert(events).values({
    id,
    title: raw.title,
    slug,
    description: raw.description ?? null,
    startDate,
    endDate,
    venueId,
    categoryId,
    imageUrl: raw.imageUrl ?? null,
    tags,
    isFree: false,
    status: "published",
    externalSource: "venue_website",
    externalId,
    externalUrl: raw.sourceUrl,
  });

  return "created";
}
