import { syncTicketmasterEvents } from "@/lib/sync/ticketmaster";
import { syncSeatGeekEvents } from "@/lib/sync/seatgeek";
import { syncFacebookGraphEvents } from "@/lib/sync/facebook-graph";
import { syncFacebookScrapedEvents } from "@/lib/sync/facebook-scraper";
import { syncVenueWebsiteEvents } from "@/lib/sync/venue-website-scraper";
import { discoverVenues } from "@/lib/sync/google-places";
import {
  toTicketmasterCities,
  toSeatGeekLocations,
  toGooglePlacesMetros,
} from "@/lib/config/metros";
import { db } from "@/lib/db";
import { syncLogs } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface EventSyncResult {
  ticketmaster: {
    eventsCreated: number;
    eventsUpdated: number;
    eventsInvalidated: number;
    venuesCreated: number;
    errors: string[];
  } | null;
  seatgeek: {
    eventsCreated: number;
    eventsUpdated: number;
    eventsInvalidated: number;
    venuesCreated: number;
    errors: string[];
  } | null;
  facebook: {
    eventsCreated: number;
    eventsUpdated: number;
    venuesCreated: number;
    pagesProcessed: number;
    errors: string[];
  } | null;
  venueWebsite: {
    eventsCreated: number;
    eventsUpdated: number;
    venuesProcessed: number;
    errors: string[];
  } | null;
  totals: {
    eventsCreated: number;
    eventsUpdated: number;
    eventsInvalidated: number;
    venuesCreated: number;
    errors: string[];
  };
  durationMs: number;
}

export interface VenueDiscoveryResult {
  venuesDiscovered: number;
  venuesUpdated: number;
  venuesNew: number;
  errors: string[];
  durationMs: number;
}

// ---------------------------------------------------------------------------
// runEventSync
// ---------------------------------------------------------------------------

export async function runEventSync(): Promise<EventSyncResult> {
  const startTime = Date.now();
  console.log("[EventSync] Starting event sync...");

  const hasTicketmaster = !!process.env.TICKETMASTER_API_KEY;
  const hasSeatGeek = !!process.env.SEATGEEK_CLIENT_ID;
  const hasFacebookGraph = !!process.env.FACEBOOK_ACCESS_TOKEN;

  if (!hasTicketmaster) {
    console.log("[EventSync] TICKETMASTER_API_KEY not configured, skipping Ticketmaster sync");
  }
  if (!hasSeatGeek) {
    console.log("[EventSync] SEATGEEK_CLIENT_ID not configured, skipping SeatGeek sync");
  }
  if (!hasFacebookGraph) {
    console.log("[EventSync] FACEBOOK_ACCESS_TOKEN not configured, skipping Facebook Graph API sync");
  }
  // Facebook scraper always runs — it scrapes public pages without an API key
  console.log("[EventSync] Facebook scraper will run for all active pages");
  // Venue website scraper always runs — scrapes public venue websites
  console.log("[EventSync] Venue website scraper will run for all venues with websites");

  // Run available syncs in parallel
  const [ticketmasterResult, seatgeekResult, facebookResult, venueWebsiteResult] = await Promise.all([
    hasTicketmaster
      ? syncTicketmasterEvents({ cities: toTicketmasterCities() }).catch((error) => {
          console.error("[EventSync] Ticketmaster sync failed:", error);
          return {
            eventsCreated: 0,
            eventsUpdated: 0,
            eventsInvalidated: 0,
            venuesCreated: 0,
            errors: [
              `Ticketmaster sync failed: ${error instanceof Error ? error.message : String(error)}`,
            ],
          };
        })
      : null,
    hasSeatGeek
      ? syncSeatGeekEvents({ locations: toSeatGeekLocations() }).catch((error) => {
          console.error("[EventSync] SeatGeek sync failed:", error);
          return {
            eventsCreated: 0,
            eventsUpdated: 0,
            eventsInvalidated: 0,
            venuesCreated: 0,
            errors: [
              `SeatGeek sync failed: ${error instanceof Error ? error.message : String(error)}`,
            ],
          };
        })
      : null,
    // Facebook: Graph API needs token, scraper always runs on public pages
    (async () => {
      const graphResult = hasFacebookGraph
        ? await syncFacebookGraphEvents()
        : { eventsCreated: 0, eventsUpdated: 0, venuesCreated: 0, pagesProcessed: 0, errors: [] };
      const scraperResult = await syncFacebookScrapedEvents();
      return {
        eventsCreated: graphResult.eventsCreated + scraperResult.eventsCreated,
        eventsUpdated: graphResult.eventsUpdated + scraperResult.eventsUpdated,
        venuesCreated: graphResult.venuesCreated + scraperResult.venuesCreated,
        pagesProcessed: graphResult.pagesProcessed + scraperResult.pagesProcessed,
        errors: [...graphResult.errors, ...scraperResult.errors],
      };
    })().catch((error) => {
      console.error("[EventSync] Facebook sync failed:", error);
      return {
        eventsCreated: 0,
        eventsUpdated: 0,
        venuesCreated: 0,
        pagesProcessed: 0,
        errors: [
          `Facebook sync failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }),
    // Venue website scraper always runs
    syncVenueWebsiteEvents().catch((error) => {
      console.error("[EventSync] Venue website sync failed:", error);
      return {
        eventsCreated: 0,
        eventsUpdated: 0,
        venuesProcessed: 0,
        errors: [
          `Venue website sync failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }),
  ]);

  const eventsInvalidated =
    (ticketmasterResult?.eventsInvalidated ?? 0) +
    (seatgeekResult?.eventsInvalidated ?? 0);

  const totals = {
    eventsCreated:
      (ticketmasterResult?.eventsCreated ?? 0) +
      (seatgeekResult?.eventsCreated ?? 0) +
      (facebookResult?.eventsCreated ?? 0) +
      (venueWebsiteResult?.eventsCreated ?? 0),
    eventsUpdated:
      (ticketmasterResult?.eventsUpdated ?? 0) +
      (seatgeekResult?.eventsUpdated ?? 0) +
      (facebookResult?.eventsUpdated ?? 0) +
      (venueWebsiteResult?.eventsUpdated ?? 0),
    eventsInvalidated,
    venuesCreated:
      (ticketmasterResult?.venuesCreated ?? 0) +
      (seatgeekResult?.venuesCreated ?? 0) +
      (facebookResult?.venuesCreated ?? 0),
    errors: [
      ...(ticketmasterResult?.errors ?? []),
      ...(seatgeekResult?.errors ?? []),
      ...(facebookResult?.errors ?? []),
      ...(venueWebsiteResult?.errors ?? []),
      ...(eventsInvalidated > 0
        ? [`${eventsInvalidated} event(s) invalidated (marked as cancelled)`]
        : []),
    ],
  };

  const durationMs = Date.now() - startTime;

  console.log("[EventSync] Completed in %dms", durationMs);
  console.log("[EventSync] Stats:", JSON.stringify(totals));

  // Write sync logs for each source
  const logEntries = [];
  if (ticketmasterResult) {
    logEntries.push({
      source: "ticketmaster",
      metro: "seattle",
      status: ticketmasterResult.errors.length > 0 ? "partial" : "success",
      eventsCreated: ticketmasterResult.eventsCreated,
      eventsUpdated: ticketmasterResult.eventsUpdated,
      venuesCreated: ticketmasterResult.venuesCreated,
      errors: ticketmasterResult.errors.length > 0 ? ticketmasterResult.errors : null,
      durationMs,
      completedAt: new Date(),
    });
  }
  if (seatgeekResult) {
    logEntries.push({
      source: "seatgeek",
      metro: "seattle",
      status: seatgeekResult.errors.length > 0 ? "partial" : "success",
      eventsCreated: seatgeekResult.eventsCreated,
      eventsUpdated: seatgeekResult.eventsUpdated,
      venuesCreated: seatgeekResult.venuesCreated,
      errors: seatgeekResult.errors.length > 0 ? seatgeekResult.errors : null,
      durationMs,
      completedAt: new Date(),
    });
  }
  if (facebookResult) {
    logEntries.push({
      source: "facebook",
      metro: "seattle",
      status: facebookResult.errors.length > 0 ? "partial" : "success",
      eventsCreated: facebookResult.eventsCreated,
      eventsUpdated: facebookResult.eventsUpdated,
      venuesCreated: facebookResult.venuesCreated,
      errors: facebookResult.errors.length > 0 ? facebookResult.errors : null,
      durationMs,
      completedAt: new Date(),
    });
  }
  if (venueWebsiteResult) {
    logEntries.push({
      source: "venue_website",
      metro: "seattle",
      status: venueWebsiteResult.errors.length > 0 ? "partial" : "success",
      eventsCreated: venueWebsiteResult.eventsCreated,
      eventsUpdated: venueWebsiteResult.eventsUpdated,
      venuesCreated: 0,
      errors: venueWebsiteResult.errors.length > 0 ? venueWebsiteResult.errors : null,
      durationMs,
      completedAt: new Date(),
    });
  }

  // Write all logs
  if (logEntries.length > 0) {
    try {
      await db.insert(syncLogs).values(logEntries);
    } catch (logError) {
      console.error("[EventSync] Failed to write sync logs:", logError);
    }
  }

  return {
    ticketmaster: ticketmasterResult,
    seatgeek: seatgeekResult,
    facebook: facebookResult,
    venueWebsite: venueWebsiteResult,
    totals,
    durationMs,
  };
}

// ---------------------------------------------------------------------------
// runVenueDiscovery
// ---------------------------------------------------------------------------

export async function runVenueDiscovery(): Promise<VenueDiscoveryResult> {
  const startTime = Date.now();
  console.log("[VenueDiscovery] Starting venue discovery...");

  const hasGooglePlaces = !!process.env.GOOGLE_PLACES_API_KEY;

  if (!hasGooglePlaces) {
    console.log("[VenueDiscovery] GOOGLE_PLACES_API_KEY not configured, skipping discovery");
    return {
      venuesDiscovered: 0,
      venuesUpdated: 0,
      venuesNew: 0,
      errors: ["GOOGLE_PLACES_API_KEY not configured"],
      durationMs: Date.now() - startTime,
    };
  }

  try {
    const result = await discoverVenues({ metros: toGooglePlacesMetros() });

    const durationMs = Date.now() - startTime;

    console.log("[VenueDiscovery] Completed in %dms", durationMs);
    console.log("[VenueDiscovery] Stats:", JSON.stringify(result));

    return {
      ...result,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = `Venue discovery failed: ${error instanceof Error ? error.message : String(error)}`;

    console.error("[VenueDiscovery]", message);

    return {
      venuesDiscovered: 0,
      venuesUpdated: 0,
      venuesNew: 0,
      errors: [message],
      durationMs,
    };
  }
}
