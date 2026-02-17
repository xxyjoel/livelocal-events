/**
 * Venue website scraper — extracts events from venue websites.
 *
 * Visits venue websites (stored in venues.website), extracts event data
 * using JSON-LD, iCal detection, and Cheerio HTML parsing, then upserts
 * into the events table.
 *
 * Follows the same patterns as facebook-scraper.ts.
 */

import * as cheerio from "cheerio";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { venues, eventSources, syncLogs } from "@/lib/db/schema";
import {
  type RawWebsiteEvent,
  type WebsiteSyncResult,
  normalizeWebsiteEvent,
} from "./venue-website-common";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCRAPE_DELAY_MS = 2000;
const MAX_CONSECUTIVE_FAILURES = 3;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// JSON-LD Extraction (reused pattern from facebook-scraper.ts)
// ---------------------------------------------------------------------------

interface JsonLdEvent {
  "@type"?: string;
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  image?: string | string[];
  url?: string;
  offers?: {
    url?: string;
  };
}

function extractJsonLdEvents(html: string): JsonLdEvent[] {
  const events: JsonLdEvent[] = [];
  const jsonLdRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item["@type"] === "Event") {
          events.push(item);
        }
        if (item["@graph"] && Array.isArray(item["@graph"])) {
          for (const graphItem of item["@graph"]) {
            if (graphItem["@type"] === "Event") {
              events.push(graphItem);
            }
          }
        }
      }
    } catch {
      // Invalid JSON — skip
    }
  }

  return events;
}

function jsonLdToRawEvent(
  jsonLd: JsonLdEvent,
  sourceUrl: string
): RawWebsiteEvent | null {
  if (!jsonLd.name || !jsonLd.startDate) return null;

  return {
    title: jsonLd.name,
    description: jsonLd.description,
    startDate: jsonLd.startDate,
    endDate: jsonLd.endDate,
    imageUrl: jsonLd.image
      ? Array.isArray(jsonLd.image)
        ? jsonLd.image[0]
        : jsonLd.image
      : undefined,
    ticketUrl: jsonLd.offers?.url ?? jsonLd.url,
    sourceUrl,
  };
}

// ---------------------------------------------------------------------------
// iCal Detection
// ---------------------------------------------------------------------------

function extractICalUrls($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const urls: string[] = [];

  // <a href="...\.ics">
  $('a[href$=".ics"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      try {
        urls.push(new URL(href, baseUrl).toString());
      } catch {
        // Invalid URL
      }
    }
  });

  // <link type="text/calendar">
  $('link[type="text/calendar"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      try {
        urls.push(new URL(href, baseUrl).toString());
      } catch {
        // Invalid URL
      }
    }
  });

  return urls;
}

// ---------------------------------------------------------------------------
// Cheerio HTML Extraction
// ---------------------------------------------------------------------------

/**
 * Parse common HTML patterns for event listings using Cheerio.
 *
 * Looks for elements with .event, .show, .listing, .calendar classes,
 * <time datetime> elements, and h2/h3 headings near dates.
 */
function extractHtmlEvents(
  $: cheerio.CheerioAPI,
  sourceUrl: string
): RawWebsiteEvent[] {
  const events: RawWebsiteEvent[] = [];
  const seen = new Set<string>();

  // Strategy 1: Look for event-like containers
  const eventSelectors = [
    ".event",
    ".show",
    ".listing",
    ".calendar-event",
    '[class*="event-item"]',
    '[class*="event-card"]',
    '[class*="show-listing"]',
    "article.event",
    ".events-list > li",
    ".events-list > div",
  ];

  for (const selector of eventSelectors) {
    $(selector).each((_, el) => {
      const $el = $(el);

      // Try to extract title
      const title =
        $el.find("h2, h3, h4, .title, .event-title, .show-title").first().text().trim() ||
        $el.find("a").first().text().trim();

      if (!title || title.length < 3) return;

      // Try to extract date
      const timeEl = $el.find("time[datetime]").first();
      let dateStr = timeEl.attr("datetime") || "";

      if (!dateStr) {
        // Look for date-like text
        const dateText = $el.find(".date, .event-date, .show-date, time").first().text().trim();
        if (dateText) {
          const parsed = new Date(dateText);
          if (!isNaN(parsed.getTime())) {
            dateStr = parsed.toISOString();
          }
        }
      }

      if (!dateStr) return;

      // Dedup key
      const key = `${title}|${dateStr}`;
      if (seen.has(key)) return;
      seen.add(key);

      // Description
      const description =
        $el.find(".description, .event-description, p").first().text().trim() || undefined;

      // Image
      const img = $el.find("img").first();
      const imageUrl = img.attr("src") || img.attr("data-src") || undefined;

      // Ticket URL
      const ticketLink = $el
        .find('a[href*="ticket"], a[href*="buy"], a.ticket, a.buy')
        .first();
      const ticketUrl = ticketLink.attr("href") || undefined;

      events.push({
        title,
        description,
        startDate: dateStr,
        imageUrl: imageUrl
          ? (() => {
              try {
                return new URL(imageUrl, sourceUrl).toString();
              } catch {
                return imageUrl;
              }
            })()
          : undefined,
        ticketUrl: ticketUrl
          ? (() => {
              try {
                return new URL(ticketUrl, sourceUrl).toString();
              } catch {
                return ticketUrl;
              }
            })()
          : undefined,
        sourceUrl,
      });
    });
  }

  // Strategy 2: Look for standalone <time datetime> elements with nearby headings
  if (events.length === 0) {
    $("time[datetime]").each((_, el) => {
      const $time = $(el);
      const dateStr = $time.attr("datetime");
      if (!dateStr) return;

      // Look for a heading nearby (parent or siblings)
      const $container = $time.closest("div, li, article, section");
      const title =
        $container.find("h2, h3, h4").first().text().trim() ||
        $container.find("a").first().text().trim();

      if (!title || title.length < 3) return;

      const key = `${title}|${dateStr}`;
      if (seen.has(key)) return;
      seen.add(key);

      events.push({
        title,
        startDate: dateStr,
        sourceUrl,
      });
    });
  }

  return events;
}

// ---------------------------------------------------------------------------
// Fetch + Extract Pipeline
// ---------------------------------------------------------------------------

async function scrapeVenueWebsite(
  websiteUrl: string,
  venueName: string
): Promise<RawWebsiteEvent[]> {
  const response = await fetch(websiteUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${websiteUrl}`);
  }

  const html = await response.text();
  const allEvents: RawWebsiteEvent[] = [];
  const now = new Date();

  // 1. JSON-LD extraction (highest quality)
  const jsonLdEvents = extractJsonLdEvents(html);
  for (const jsonLd of jsonLdEvents) {
    const raw = jsonLdToRawEvent(jsonLd, websiteUrl);
    if (raw && new Date(raw.startDate) >= now) {
      allEvents.push(raw);
    }
  }

  // 2. iCal detection (log for future use — not parsed inline)
  const $ = cheerio.load(html);
  const icalUrls = extractICalUrls($, websiteUrl);
  if (icalUrls.length > 0) {
    console.log(
      `[Venue Scraper] Found ${icalUrls.length} iCal feed(s) for ${venueName}: ${icalUrls.join(", ")}`
    );
  }

  // 3. Cheerio HTML parsing (fallback if no JSON-LD found)
  if (allEvents.length === 0) {
    const htmlEvents = extractHtmlEvents($, websiteUrl);
    for (const ev of htmlEvents) {
      if (new Date(ev.startDate) >= now) {
        allEvents.push(ev);
      }
    }
  }

  return allEvents;
}

// ---------------------------------------------------------------------------
// Main Sync Function
// ---------------------------------------------------------------------------

/**
 * Sync events from all venue websites that have a website URL.
 *
 * Iterates through venues with a non-null website column, scrapes
 * each for events, normalizes, and upserts into the events table.
 */
export async function syncVenueWebsiteEvents(): Promise<WebsiteSyncResult> {
  const startTime = Date.now();
  const stats: WebsiteSyncResult = {
    eventsCreated: 0,
    eventsUpdated: 0,
    venuesProcessed: 0,
    errors: [],
  };

  // Get all venues with websites
  const venueRows = await db
    .select({
      id: venues.id,
      name: venues.name,
      slug: venues.slug,
      website: venues.website,
      city: venues.city,
    })
    .from(venues)
    .where(isNotNull(venues.website));

  console.log(
    `[Venue Scraper] Found ${venueRows.length} venues with websites`
  );

  // Track consecutive failures per venue
  const failureCounts = new Map<string, number>();

  for (const venue of venueRows) {
    const failures = failureCounts.get(venue.id) ?? 0;
    if (failures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(
        `[Venue Scraper] Skipping ${venue.name} — ${MAX_CONSECUTIVE_FAILURES}+ consecutive failures`
      );
      continue;
    }

    try {
      console.log(`[Venue Scraper] Scraping: ${venue.name} (${venue.website})`);

      const rawEvents = await scrapeVenueWebsite(venue.website!, venue.name);

      console.log(
        `[Venue Scraper] Found ${rawEvents.length} future events for ${venue.name}`
      );

      for (const rawEvent of rawEvents) {
        try {
          const result = await normalizeWebsiteEvent(
            rawEvent,
            venue.id,
            venue.name
          );
          if (result === "created") stats.eventsCreated++;
          else if (result === "updated") stats.eventsUpdated++;
        } catch (error) {
          const msg = `Error processing event "${rawEvent.title}" from ${venue.name}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`[Venue Scraper] ${msg}`);
          stats.errors.push(msg);
        }
      }

      // Record success on venue
      await db
        .update(venues)
        .set({
          lastScrapedAt: new Date(),
          lastScrapeError: null,
          updatedAt: new Date(),
        })
        .where(eq(venues.id, venue.id));

      // Reset failure count on success
      failureCounts.set(venue.id, 0);
      stats.venuesProcessed++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const msg = `Failed to scrape ${venue.name} (${venue.website}): ${errorMsg}`;
      console.error(`[Venue Scraper] ${msg}`);
      stats.errors.push(msg);

      // Record failure on venue
      await db
        .update(venues)
        .set({
          lastScrapedAt: new Date(),
          lastScrapeError: errorMsg,
          updatedAt: new Date(),
        })
        .where(eq(venues.id, venue.id));

      failureCounts.set(venue.id, failures + 1);
    }

    // Rate limiting
    await sleep(SCRAPE_DELAY_MS);
  }

  // Update event_sources row for company_website
  try {
    await db
      .update(eventSources)
      .set({
        lastSyncAt: new Date(),
        totalEventsSynced: stats.eventsCreated + stats.eventsUpdated,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(eventSources.slug, "company_website"));
  } catch (error) {
    console.error("[Venue Scraper] Failed to update event_sources:", error);
  }

  // Write sync_logs entry
  const durationMs = Date.now() - startTime;
  try {
    await db.insert(syncLogs).values({
      source: "venue_website",
      metro: "seattle",
      status:
        stats.errors.length === 0
          ? "success"
          : stats.venuesProcessed > 0
            ? "partial"
            : "failed",
      eventsCreated: stats.eventsCreated,
      eventsUpdated: stats.eventsUpdated,
      venuesCreated: 0,
      errors: stats.errors.length > 0 ? stats.errors : null,
      durationMs,
      completedAt: new Date(),
    });
  } catch (logError) {
    console.error("[Venue Scraper] Failed to write sync_logs:", logError);
  }

  console.log(
    `[Venue Scraper] Scrape complete in ${durationMs}ms. Created: ${stats.eventsCreated}, Updated: ${stats.eventsUpdated}, Venues: ${stats.venuesProcessed}, Errors: ${stats.errors.length}`
  );

  return stats;
}
