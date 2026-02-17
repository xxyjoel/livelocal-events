/**
 * Facebook event scraper — fallback approach.
 *
 * Attempts to scrape event data from public Facebook pages when the
 * Graph API is unavailable. Parses JSON-LD structured data from the
 * page HTML.
 *
 * This is intentionally fragile by design — Facebook frequently changes
 * their page structure. Three consecutive failures mark a page as "failed".
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { facebookPages } from "@/lib/db/schema";
import {
  type RawFacebookEvent,
  type FacebookSyncResult,
  normalizeFacebookEvent,
} from "./facebook-common";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCRAPE_DELAY_MS = 2000; // Be gentle — slower than Graph API
const MAX_CONSECUTIVE_FAILURES = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// JSON-LD Parser
// ---------------------------------------------------------------------------

interface JsonLdEvent {
  "@type"?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    "@type"?: string;
    name?: string;
    address?: {
      "@type"?: string;
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
    geo?: {
      latitude?: number;
      longitude?: number;
    };
  };
  image?: string | string[];
  url?: string;
  eventStatus?: string;
  offers?: {
    url?: string;
  };
}

/**
 * Extract JSON-LD event data from HTML page source.
 */
function extractJsonLdEvents(html: string): JsonLdEvent[] {
  const events: JsonLdEvent[] = [];

  // Match <script type="application/ld+json"> blocks
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);

      // Handle single objects or arrays
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item["@type"] === "Event") {
          events.push(item);
        }
        // Also check @graph arrays
        if (item["@graph"] && Array.isArray(item["@graph"])) {
          for (const graphItem of item["@graph"]) {
            if (graphItem["@type"] === "Event") {
              events.push(graphItem);
            }
          }
        }
      }
    } catch {
      // Invalid JSON — skip this block
    }
  }

  return events;
}

/**
 * Convert a JSON-LD event to our common RawFacebookEvent format.
 */
function jsonLdToRawEvent(jsonLd: JsonLdEvent): RawFacebookEvent | null {
  if (!jsonLd.name || !jsonLd.startDate) return null;

  return {
    name: jsonLd.name,
    description: jsonLd.description,
    startTime: jsonLd.startDate,
    endTime: jsonLd.endDate,
    place: jsonLd.location
      ? {
          name: jsonLd.location.name,
          location: {
            city: jsonLd.location.address?.addressLocality,
            state: jsonLd.location.address?.addressRegion,
            country: jsonLd.location.address?.addressCountry,
            latitude: jsonLd.location.geo?.latitude,
            longitude: jsonLd.location.geo?.longitude,
            street: jsonLd.location.address?.streetAddress,
            zip: jsonLd.location.address?.postalCode,
          },
        }
      : undefined,
    cover: jsonLd.image
      ? {
          source: Array.isArray(jsonLd.image)
            ? jsonLd.image[0]
            : jsonLd.image,
        }
      : undefined,
    ticketUri: jsonLd.offers?.url ?? jsonLd.url,
    isCanceled: jsonLd.eventStatus === "https://schema.org/EventCancelled",
  };
}

// ---------------------------------------------------------------------------
// Scraper
// ---------------------------------------------------------------------------

/**
 * Attempt to scrape events from a Facebook page's events URL.
 */
async function scrapePageEvents(
  pageUrl: string
): Promise<RawFacebookEvent[]> {
  // Normalize the URL to point to the events page
  const eventsUrl = pageUrl.replace(/\/$/, "") + "/events";

  const response = await fetch(eventsUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${eventsUrl}: ${response.status}`);
  }

  const html = await response.text();
  const jsonLdEvents = extractJsonLdEvents(html);

  const rawEvents: RawFacebookEvent[] = [];
  const now = new Date();

  for (const jsonLd of jsonLdEvents) {
    const rawEvent = jsonLdToRawEvent(jsonLd);
    if (rawEvent && new Date(rawEvent.startTime) >= now) {
      rawEvents.push(rawEvent);
    }
  }

  return rawEvents;
}

// ---------------------------------------------------------------------------
// Main Sync Function
// ---------------------------------------------------------------------------

/**
 * Scrape events from active Facebook pages that don't have Graph API access.
 *
 * This is a supplementary approach — pages without a pageId (no Graph API
 * access) are scraped via their public URL.
 *
 * Three consecutive failures mark a page as "failed" to prevent wasting
 * resources on broken pages.
 */
export async function syncFacebookScrapedEvents(): Promise<FacebookSyncResult> {
  const stats: FacebookSyncResult = {
    eventsCreated: 0,
    eventsUpdated: 0,
    venuesCreated: 0,
    pagesProcessed: 0,
    errors: [],
  };

  // Get active pages without a Graph API pageId
  const activePages = await db
    .select()
    .from(facebookPages)
    .where(eq(facebookPages.status, "active"));

  const scrapablePages = activePages.filter((p) => !p.pageId && p.pageUrl);

  console.log(
    `[Facebook Scraper] Found ${scrapablePages.length} pages to scrape`
  );

  for (const page of scrapablePages) {
    try {
      console.log(
        `[Facebook Scraper] Scraping: ${page.pageName ?? page.pageUrl}`
      );

      const rawEvents = await scrapePageEvents(page.pageUrl);

      console.log(
        `[Facebook Scraper] Found ${rawEvents.length} future events for ${page.pageName ?? page.pageUrl}`
      );

      for (const rawEvent of rawEvents) {
        try {
          const result = await normalizeFacebookEvent(rawEvent);

          if (result === "created") stats.eventsCreated++;
          else if (result === "updated") stats.eventsUpdated++;
        } catch (error) {
          const msg = `Error processing scraped event "${rawEvent.name}": ${error instanceof Error ? error.message : String(error)}`;
          console.error(`[Facebook Scraper] ${msg}`);
          stats.errors.push(msg);
        }
      }

      // Update page sync metadata — reset error state on success
      await db
        .update(facebookPages)
        .set({
          lastSyncAt: new Date(),
          lastSyncError: null,
          syncCount: (page.syncCount ?? 0) + 1,
          eventsFound: rawEvents.length,
          updatedAt: new Date(),
        })
        .where(eq(facebookPages.id, page.id));

      stats.pagesProcessed++;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      const msg = `Failed to scrape page "${page.pageName ?? page.pageUrl}": ${errorMsg}`;
      console.error(`[Facebook Scraper] ${msg}`);
      stats.errors.push(msg);

      // Track consecutive failures
      const consecutiveFailures = page.lastSyncError ? (page.syncCount ?? 0) : 1;

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        // Mark as failed after too many consecutive failures
        await db
          .update(facebookPages)
          .set({
            status: "failed",
            lastSyncAt: new Date(),
            lastSyncError: `Failed ${MAX_CONSECUTIVE_FAILURES} consecutive times: ${errorMsg}`,
            updatedAt: new Date(),
          })
          .where(eq(facebookPages.id, page.id));

        console.warn(
          `[Facebook Scraper] Page "${page.pageName}" marked as failed after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`
        );
      } else {
        await db
          .update(facebookPages)
          .set({
            lastSyncAt: new Date(),
            lastSyncError: errorMsg,
            updatedAt: new Date(),
          })
          .where(eq(facebookPages.id, page.id));
      }
    }

    // Be gentle with scraping
    await sleep(SCRAPE_DELAY_MS);
  }

  console.log(
    `[Facebook Scraper] Scrape complete. Created: ${stats.eventsCreated}, Updated: ${stats.eventsUpdated}, Pages: ${stats.pagesProcessed}, Errors: ${stats.errors.length}`
  );

  return stats;
}
