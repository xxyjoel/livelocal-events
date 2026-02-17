/**
 * Common utilities shared across Facebook sync approaches
 * (Graph API, scraper, manual links).
 */

import { eq, and, ilike, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { events, venues, categories, facebookPages } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { normalizeTags } from "@/lib/sync/tag-normalizer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw event data from Facebook (Graph API or scraper). */
export interface RawFacebookEvent {
  id?: string;
  name: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime?: string;
  place?: {
    name?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      street?: string;
      zip?: string;
    };
  };
  cover?: {
    source?: string;
  };
  category?: string;
  ticketUri?: string;
  isOnline?: boolean;
  isCanceled?: boolean;
}

/** Result stats for a Facebook sync run. */
export interface FacebookSyncResult {
  eventsCreated: number;
  eventsUpdated: number;
  venuesCreated: number;
  pagesProcessed: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

/** In-memory cache of category slug -> id */
const categoryCache = new Map<string, string>();

/**
 * Keyword-based category detection from event title/description.
 *
 * Checks keywords in order of specificity. Falls back to "concerts".
 */
const CATEGORY_KEYWORDS: Array<{ keywords: string[]; slug: string }> = [
  { keywords: ["comedy", "stand-up", "standup", "improv", "sketch"], slug: "comedy" },
  { keywords: ["dj", "edm", "techno", "house music", "dance party", "club night", "rave"], slug: "nightlife" },
  { keywords: ["theater", "theatre", "musical", "broadway", "play", "drama"], slug: "theater" },
  { keywords: ["festival", "fest"], slug: "festivals" },
  { keywords: ["basketball", "football", "soccer", "baseball", "hockey", "sports", "game day"], slug: "sports" },
  { keywords: ["gallery", "art walk", "exhibition", "museum", "film screening", "poetry", "literary"], slug: "arts" },
  { keywords: ["market", "workshop", "meetup", "community", "fundraiser", "charity", "class", "family"], slug: "community" },
  { keywords: ["concert", "live music", "band", "show", "gig", "tour", "acoustic"], slug: "concerts" },
];

/**
 * Map a Facebook event to one of our category IDs based on keywords
 * in the title, description, and FB category field.
 */
export async function mapFacebookCategory(
  title: string,
  description?: string,
  fbCategory?: string
): Promise<string> {
  const searchText = [title, description ?? "", fbCategory ?? ""]
    .join(" ")
    .toLowerCase();

  let slug = "concerts"; // default

  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((kw) => searchText.includes(kw))) {
      slug = entry.slug;
      break;
    }
  }

  // Check cache
  const cached = categoryCache.get(slug);
  if (cached) return cached;

  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (rows[0]) {
    categoryCache.set(slug, rows[0].id);
    return rows[0].id;
  }

  // Fallback to concerts
  if (slug !== "concerts") {
    const fallback = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, "concerts"))
      .limit(1);

    if (fallback[0]) {
      categoryCache.set(slug, fallback[0].id);
      return fallback[0].id;
    }
  }

  throw new Error(`Category not found for slug "${slug}". Ensure categories are seeded.`);
}

// ---------------------------------------------------------------------------
// Tag extraction
// ---------------------------------------------------------------------------

/**
 * Extract tags from a Facebook event using keyword detection.
 */
export function extractFacebookTags(
  title: string,
  description?: string,
  fbCategory?: string
): string[] {
  const searchText = [title, description ?? "", fbCategory ?? ""]
    .join(" ")
    .toLowerCase();

  const rawTags: string[] = [];

  // Genre/style keywords to check
  const tagKeywords: Record<string, string> = {
    "rock": "rock",
    "indie": "indie",
    "hip hop": "hip-hop",
    "hip-hop": "hip-hop",
    "rap": "hip-hop",
    "jazz": "jazz",
    "blues": "blues",
    "folk": "folk",
    "classical": "classical",
    "metal": "metal",
    "punk": "punk",
    "latin": "latin",
    "country": "country",
    "pop": "pop",
    "r&b": "r-and-b",
    "edm": "edm",
    "house": "house",
    "techno": "techno",
    "dj": "dj-set",
    "karaoke": "karaoke",
    "stand-up": "stand-up",
    "standup": "stand-up",
    "improv": "improv",
    "open mic": "open-mic",
    "comedy": "comedy-show",
    "drag": "drag-show",
    "musical": "musical",
    "film": "film-screening",
    "gallery": "gallery-opening",
    "workshop": "workshop",
    "market": "market",
    "festival": "music-festival",
  };

  for (const [keyword, tag] of Object.entries(tagKeywords)) {
    if (searchText.includes(keyword)) {
      rawTags.push(tag);
    }
  }

  return normalizeTags(rawTags);
}

// ---------------------------------------------------------------------------
// Venue matching / upsert
// ---------------------------------------------------------------------------

/**
 * Match a Facebook venue to an existing venue or create a new one.
 *
 * Matching order:
 * 1. facebookPageId exact match (from the facebookPages table link)
 * 2. Name + city case-insensitive match
 * 3. Create new venue with source "facebook"
 */
export async function upsertVenueFromFacebook(
  fbPlace: NonNullable<RawFacebookEvent["place"]>,
  facebookPageId?: string
): Promise<{ venueId: string; created: boolean }> {
  const placeName = fbPlace.name ?? "Unknown Venue";
  const city = fbPlace.location?.city ?? null;
  const state = fbPlace.location?.state ?? null;
  const lat = fbPlace.location?.latitude ?? null;
  const lng = fbPlace.location?.longitude ?? null;
  const address = fbPlace.location?.street ?? null;
  const zipCode = fbPlace.location?.zip ?? null;
  const country = fbPlace.location?.country ?? "US";

  // Strategy 1: Match by facebookPageId
  if (facebookPageId) {
    const byFbId = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.facebookPageId, facebookPageId))
      .limit(1);

    if (byFbId[0]) {
      // Update with any new data
      await db
        .update(venues)
        .set({
          address: address ?? undefined,
          city: city ?? undefined,
          state: state ?? undefined,
          latitude: lat ?? undefined,
          longitude: lng ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(venues.id, byFbId[0].id));

      return { venueId: byFbId[0].id, created: false };
    }
  }

  // Strategy 2: Name + city match
  if (city) {
    const byName = await db
      .select({ id: venues.id })
      .from(venues)
      .where(
        and(
          ilike(venues.name, placeName),
          ilike(venues.city, city)
        )
      )
      .limit(1);

    if (byName[0]) {
      // Link the FB page ID if we have one
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      if (facebookPageId) {
        updateData.facebookPageId = facebookPageId;
      }
      if (address) updateData.address = address;
      if (lat) updateData.latitude = lat;
      if (lng) updateData.longitude = lng;

      await db
        .update(venues)
        .set(updateData)
        .where(eq(venues.id, byName[0].id));

      return { venueId: byName[0].id, created: false };
    }
  }

  // Strategy 3: Create new venue
  const id = createId();
  const baseSlug = slugify(city ? `${placeName} ${city}` : placeName);
  const slug = `${baseSlug}-${id.slice(0, 6)}`;

  await db.insert(venues).values({
    id,
    name: placeName,
    slug,
    address,
    city,
    state,
    zipCode,
    country,
    latitude: lat,
    longitude: lng,
    facebookPageId: facebookPageId ?? null,
    source: "facebook",
    isVerified: false,
  });

  return { venueId: id, created: true };
}

// ---------------------------------------------------------------------------
// Event normalization + upsert
// ---------------------------------------------------------------------------

/**
 * Normalize a raw Facebook event and upsert it into the database.
 *
 * Returns whether the event was created, updated, or skipped.
 */
export async function normalizeFacebookEvent(
  rawEvent: RawFacebookEvent,
  facebookPageId?: string
): Promise<"created" | "updated" | "skipped"> {
  // Skip online-only events
  if (rawEvent.isOnline) return "skipped";

  // Parse dates
  const startDate = new Date(rawEvent.startTime);
  if (isNaN(startDate.getTime())) return "skipped";

  const endDate = rawEvent.endTime ? new Date(rawEvent.endTime) : null;

  // Venue
  if (!rawEvent.place?.name) return "skipped";

  const { venueId } = await upsertVenueFromFacebook(
    rawEvent.place,
    facebookPageId
  );

  // Category
  const categoryId = await mapFacebookCategory(
    rawEvent.name,
    rawEvent.description,
    rawEvent.category
  );

  // Tags
  const tags = extractFacebookTags(
    rawEvent.name,
    rawEvent.description,
    rawEvent.category
  );

  // Images
  const imageUrl = rawEvent.cover?.source ?? null;

  // Status
  const status = rawEvent.isCanceled ? "cancelled" : "published";

  // External ID
  const externalId = rawEvent.id ?? null;

  // Check for existing event by external ID
  if (externalId) {
    const existing = await db
      .select({ id: events.id })
      .from(events)
      .where(
        and(
          eq(events.externalSource, "facebook"),
          eq(events.externalId, externalId)
        )
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(events)
        .set({
          title: rawEvent.name,
          description: rawEvent.description ?? null,
          startDate,
          endDate,
          venueId,
          categoryId,
          imageUrl,
          tags,
          status,
          externalUrl: rawEvent.ticketUri ?? null,
          updatedAt: new Date(),
        })
        .where(eq(events.id, existing[0].id));

      return "updated";
    }
  }

  // Create new event
  const id = createId();
  const city = rawEvent.place?.location?.city ?? "";
  const baseSlug = slugify(city ? `${rawEvent.name} ${city}` : rawEvent.name);
  const slug = `${baseSlug}-${id.slice(0, 6)}`;

  await db.insert(events).values({
    id,
    title: rawEvent.name,
    slug,
    description: rawEvent.description ?? null,
    startDate,
    endDate,
    venueId,
    categoryId,
    latitude: rawEvent.place?.location?.latitude ?? null,
    longitude: rawEvent.place?.location?.longitude ?? null,
    imageUrl,
    tags,
    isFree: false,
    status: "published",
    externalSource: "facebook",
    externalId,
    externalUrl: rawEvent.ticketUri ?? null,
  });

  return "created";
}
