/**
 * Facebook Graph API sync.
 *
 * For each active Facebook page in the database, fetches events via
 * the Graph API and normalizes them into our schema.
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

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";
const RATE_LIMIT_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GraphApiEvent {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time?: string;
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
  ticket_uri?: string;
  is_online?: boolean;
  is_canceled?: boolean;
}

interface GraphApiEventsResponse {
  data?: GraphApiEvent[];
  paging?: {
    cursors?: { after?: string };
    next?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert a Graph API event to our common RawFacebookEvent format.
 */
function toRawEvent(graphEvent: GraphApiEvent): RawFacebookEvent {
  return {
    id: graphEvent.id,
    name: graphEvent.name,
    description: graphEvent.description,
    startTime: graphEvent.start_time,
    endTime: graphEvent.end_time,
    place: graphEvent.place,
    cover: graphEvent.cover,
    category: graphEvent.category,
    ticketUri: graphEvent.ticket_uri,
    isOnline: graphEvent.is_online,
    isCanceled: graphEvent.is_canceled,
  };
}

// ---------------------------------------------------------------------------
// Graph API Client
// ---------------------------------------------------------------------------

/**
 * Fetch events for a Facebook page via the Graph API.
 *
 * Requires a valid access token with `pages_read_engagement` permission.
 */
async function fetchPageEvents(
  pageId: string,
  accessToken: string
): Promise<GraphApiEvent[]> {
  const allEvents: GraphApiEvent[] = [];
  let url = `${GRAPH_API_BASE}/${pageId}/events?fields=id,name,description,start_time,end_time,place,cover,category,ticket_uri,is_online,is_canceled&limit=100&access_token=${accessToken}`;

  while (url) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `Facebook Graph API error ${response.status}: ${text.slice(0, 500)}`
      );
    }

    const data: GraphApiEventsResponse = await response.json();

    if (data.error) {
      throw new Error(
        `Facebook Graph API error [${data.error.code}]: ${data.error.message}`
      );
    }

    if (data.data) {
      // Only include future events
      const now = new Date();
      const futureEvents = data.data.filter(
        (e) => new Date(e.start_time) >= now
      );
      allEvents.push(...futureEvents);
    }

    // Follow pagination
    url = data.paging?.next ?? "";

    if (url) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  return allEvents;
}

// ---------------------------------------------------------------------------
// Main Sync Function
// ---------------------------------------------------------------------------

/**
 * Sync events from all active Facebook pages that have a pageId.
 *
 * For each page:
 * 1. Fetch events from the Graph API
 * 2. Normalize each event using the common normalizer
 * 3. Update the page's sync metadata
 *
 * @returns Aggregate sync statistics.
 */
export async function syncFacebookGraphEvents(): Promise<FacebookSyncResult> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  const stats: FacebookSyncResult = {
    eventsCreated: 0,
    eventsUpdated: 0,
    venuesCreated: 0,
    pagesProcessed: 0,
    errors: [],
  };

  if (!accessToken) {
    console.log("[Facebook] FACEBOOK_ACCESS_TOKEN not configured, skipping Graph API sync");
    return stats;
  }

  // Get all active pages with a pageId
  const activePages = await db
    .select()
    .from(facebookPages)
    .where(eq(facebookPages.status, "active"));

  const pagesWithId = activePages.filter((p) => p.pageId);

  console.log(
    `[Facebook] Found ${pagesWithId.length} active pages with Graph API access`
  );

  for (const page of pagesWithId) {
    try {
      console.log(`[Facebook] Syncing page: ${page.pageName ?? page.pageUrl}`);

      const graphEvents = await fetchPageEvents(page.pageId!, accessToken);

      console.log(
        `[Facebook] Fetched ${graphEvents.length} future events for ${page.pageName}`
      );

      let pageEventsCreated = 0;

      for (const graphEvent of graphEvents) {
        try {
          const rawEvent = toRawEvent(graphEvent);
          const result = await normalizeFacebookEvent(rawEvent, page.pageId!);

          if (result === "created") {
            stats.eventsCreated++;
            pageEventsCreated++;
          } else if (result === "updated") {
            stats.eventsUpdated++;
          }
        } catch (error) {
          const msg = `Error processing FB event "${graphEvent.name}": ${error instanceof Error ? error.message : String(error)}`;
          console.error(`[Facebook] ${msg}`);
          stats.errors.push(msg);
        }
      }

      // Update page sync metadata
      await db
        .update(facebookPages)
        .set({
          lastSyncAt: new Date(),
          lastSyncError: null,
          syncCount: (page.syncCount ?? 0) + 1,
          eventsFound: graphEvents.length,
          updatedAt: new Date(),
        })
        .where(eq(facebookPages.id, page.id));

      stats.pagesProcessed++;

      // Rate limit between pages
      await sleep(RATE_LIMIT_DELAY_MS);
    } catch (error) {
      const msg = `Failed to sync FB page "${page.pageName ?? page.pageUrl}": ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[Facebook] ${msg}`);
      stats.errors.push(msg);

      // Update page with error
      await db
        .update(facebookPages)
        .set({
          lastSyncAt: new Date(),
          lastSyncError:
            error instanceof Error ? error.message : String(error),
          updatedAt: new Date(),
        })
        .where(eq(facebookPages.id, page.id));
    }
  }

  console.log(
    `[Facebook] Graph API sync complete. Created: ${stats.eventsCreated}, Updated: ${stats.eventsUpdated}, Pages: ${stats.pagesProcessed}, Errors: ${stats.errors.length}`
  );

  return stats;
}
