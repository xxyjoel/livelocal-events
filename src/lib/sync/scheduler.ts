import { syncTicketmasterEvents } from "@/lib/sync/ticketmaster";
import { syncSeatGeekEvents } from "@/lib/sync/seatgeek";
import { discoverVenues } from "@/lib/sync/google-places";

// ---------------------------------------------------------------------------
// Default sync configuration
// ---------------------------------------------------------------------------

const SYNC_CITIES = [
  { city: "New York", stateCode: "NY" },
  { city: "Los Angeles", stateCode: "CA" },
  { city: "Chicago", stateCode: "IL" },
  { city: "Austin", stateCode: "TX" },
  { city: "Nashville", stateCode: "TN" },
] as const;

const SYNC_LOCATIONS = [
  { lat: 40.7128, lon: -74.006, range: "25mi" },
  { lat: 34.0522, lon: -118.2437, range: "30mi" },
  { lat: 41.8781, lon: -87.6298, range: "20mi" },
  { lat: 30.2672, lon: -97.7431, range: "15mi" },
  { lat: 36.1627, lon: -86.7816, range: "15mi" },
] as const;

const DISCOVERY_METROS = [
  { name: "New York", lat: 40.7128, lng: -74.006, radiusMeters: 25000 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, radiusMeters: 30000 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298, radiusMeters: 20000 },
  { name: "Austin", lat: 30.2672, lng: -97.7431, radiusMeters: 15000 },
  { name: "Nashville", lat: 36.1627, lng: -86.7816, radiusMeters: 15000 },
] as const;

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface EventSyncResult {
  ticketmaster: {
    eventsCreated: number;
    eventsUpdated: number;
    venuesCreated: number;
    errors: string[];
  } | null;
  seatgeek: {
    eventsCreated: number;
    eventsUpdated: number;
    venuesCreated: number;
    errors: string[];
  } | null;
  totals: {
    eventsCreated: number;
    eventsUpdated: number;
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

  if (!hasTicketmaster) {
    console.log("[EventSync] TICKETMASTER_API_KEY not configured, skipping Ticketmaster sync");
  }
  if (!hasSeatGeek) {
    console.log("[EventSync] SEATGEEK_CLIENT_ID not configured, skipping SeatGeek sync");
  }

  // Run available syncs in parallel
  const [ticketmasterResult, seatgeekResult] = await Promise.all([
    hasTicketmaster
      ? syncTicketmasterEvents({ cities: [...SYNC_CITIES] }).catch((error) => {
          console.error("[EventSync] Ticketmaster sync failed:", error);
          return {
            eventsCreated: 0,
            eventsUpdated: 0,
            venuesCreated: 0,
            errors: [
              `Ticketmaster sync failed: ${error instanceof Error ? error.message : String(error)}`,
            ],
          };
        })
      : null,
    hasSeatGeek
      ? syncSeatGeekEvents({ locations: [...SYNC_LOCATIONS] }).catch((error) => {
          console.error("[EventSync] SeatGeek sync failed:", error);
          return {
            eventsCreated: 0,
            eventsUpdated: 0,
            venuesCreated: 0,
            errors: [
              `SeatGeek sync failed: ${error instanceof Error ? error.message : String(error)}`,
            ],
          };
        })
      : null,
  ]);

  const totals = {
    eventsCreated:
      (ticketmasterResult?.eventsCreated ?? 0) + (seatgeekResult?.eventsCreated ?? 0),
    eventsUpdated:
      (ticketmasterResult?.eventsUpdated ?? 0) + (seatgeekResult?.eventsUpdated ?? 0),
    venuesCreated:
      (ticketmasterResult?.venuesCreated ?? 0) + (seatgeekResult?.venuesCreated ?? 0),
    errors: [
      ...(ticketmasterResult?.errors ?? []),
      ...(seatgeekResult?.errors ?? []),
    ],
  };

  const durationMs = Date.now() - startTime;

  console.log("[EventSync] Completed in %dms", durationMs);
  console.log("[EventSync] Stats:", JSON.stringify(totals));

  return {
    ticketmaster: ticketmasterResult,
    seatgeek: seatgeekResult,
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
    const result = await discoverVenues({ metros: [...DISCOVERY_METROS] });

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
