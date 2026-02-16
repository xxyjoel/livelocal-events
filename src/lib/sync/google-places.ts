import { db } from "@/lib/db";
import { venues } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { createId } from "@paralleldrive/cuid2";
import { eq, and, ilike } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOOGLE_PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.types",
  "places.regularOpeningHours",
  "places.photos",
].join(",");

/** Delay between successive API requests (ms) to respect rate limits. */
const REQUEST_DELAY_MS = 500;

/**
 * Default search queries used to discover music-oriented venues that major
 * ticketing platforms typically miss.
 */
export const VENUE_SEARCH_QUERIES = [
  "live music venue",
  "live music bar",
  "jazz club",
  "blues bar",
  "comedy club",
  "open mic night venue",
  "concert hall",
  "music lounge",
  "rock bar live music",
  "indie music venue",
] as const;

/**
 * Default metropolitan areas for initial venue discovery runs.
 */
export const DEFAULT_METROS: Metro[] = [
  { name: "New York", lat: 40.7128, lng: -74.006, radiusMeters: 25000 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, radiusMeters: 30000 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298, radiusMeters: 20000 },
  { name: "Austin", lat: 30.2672, lng: -97.7431, radiusMeters: 15000 },
  { name: "Nashville", lat: 36.1627, lng: -86.7816, radiusMeters: 15000 },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A metropolitan area used as a geographic center for searches. */
export interface Metro {
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

/** Location bias for a Google Places text search. */
export interface LocationBias {
  lat: number;
  lng: number;
  radiusMeters: number;
}

/** Options for a single Google Places text search request. */
export interface SearchGooglePlacesOptions {
  query: string;
  locationBias: LocationBias;
  /** Maximum results to return (1-20). Defaults to 20. */
  maxResults?: number;
}

/** A single place returned from the Google Places (New) API. */
export interface GooglePlace {
  id: string;
  displayName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  types: string[];
  photos: GooglePlacePhoto[];
}

/** A photo reference from the Google Places API. */
export interface GooglePlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

/** Parsed US address components. */
export interface ParsedAddress {
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
}

/** Options for the main discovery function. */
export interface DiscoverVenuesOptions {
  metros: Metro[];
  /** Override the default search queries. */
  queries?: string[];
}

/** Statistics returned by a discovery run. */
export interface DiscoveryStats {
  venuesDiscovered: number;
  venuesUpdated: number;
  venuesNew: number;
  errors: string[];
}

/** The result of upserting a single venue. */
interface UpsertResult {
  venue: typeof venues.$inferSelect;
  action: "created" | "updated";
}

// ---------------------------------------------------------------------------
// Raw Google Places API response types (internal)
// ---------------------------------------------------------------------------

interface RawGooglePlacesResponse {
  places?: RawGooglePlace[];
  error?: { code: number; message: string; status: string };
}

interface RawGooglePlace {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  types?: string[];
  regularOpeningHours?: unknown;
  photos?: Array<{ name?: string; widthPx?: number; heightPx?: number }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the Google Places API key, throwing a descriptive error if it is
 * not configured.
 */
function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is not set. Configure it in your environment " +
        "variables to use Google Places discovery."
    );
  }
  return key;
}

/** Sleep for the given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Address parsing
// ---------------------------------------------------------------------------

/**
 * Parse a Google-formatted US address string into its component parts.
 *
 * Handles the common formats:
 * - "123 Main St, Austin, TX 78701, USA"
 * - "Austin, TX, USA"
 * - "Austin, TX 78701, USA"
 *
 * Returns partial data rather than throwing when the format is unexpected.
 *
 * @param formattedAddress - The `formattedAddress` field from the Google Places API.
 * @returns Parsed address components, with `null` for any part that could not be determined.
 */
export function parseGoogleAddress(formattedAddress: string): ParsedAddress {
  const result: ParsedAddress = {
    address: null,
    city: null,
    state: null,
    zipCode: null,
    country: null,
  };

  if (!formattedAddress) return result;

  // Split on commas and trim each part.
  const parts = formattedAddress.split(",").map((p) => p.trim());

  if (parts.length === 0) return result;

  // The last part is typically the country.
  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    // Accept "USA", "US", "United States", or treat as country regardless.
    result.country = lastPart;
  }

  // Try to identify state + zip from the second-to-last part (e.g. "TX 78701" or "TX").
  if (parts.length >= 2) {
    const stateZipPart = parts[parts.length - 2];
    // Match patterns like "TX 78701", "TX", "New York 10001", etc.
    const stateZipMatch = stateZipPart.match(
      /^([A-Za-z][A-Za-z .]+?)\s+(\d{5}(?:-\d{4})?)$/
    );
    if (stateZipMatch) {
      result.state = stateZipMatch[1].trim();
      result.zipCode = stateZipMatch[2];
    } else {
      // No zip code — the whole part is the state.
      result.state = stateZipPart.trim() || null;
    }
  }

  // The city is typically the part before state+zip.
  if (parts.length >= 3) {
    result.city = parts[parts.length - 3].trim() || null;
  }

  // Everything before the city is the street address.
  if (parts.length >= 4) {
    result.address = parts
      .slice(0, parts.length - 3)
      .join(", ")
      .trim() || null;
  }

  // If we only had 2 parts (e.g. "Austin, USA"), city might be the first part.
  if (parts.length === 2 && !result.city) {
    result.city = parts[0].trim() || null;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Google Places API client
// ---------------------------------------------------------------------------

/**
 * Search Google Places (New) Text Search API for venues matching the given
 * query within a geographic area.
 *
 * @param options - Search parameters including query string, location bias,
 *   and optional max results (1-20, default 20).
 * @returns An array of parsed {@link GooglePlace} objects.
 * @throws If the API key is missing or the API returns a non-retryable error.
 */
export async function searchGooglePlaces(
  options: SearchGooglePlacesOptions
): Promise<GooglePlace[]> {
  const { query, locationBias, maxResults = 20 } = options;
  const apiKey = getApiKey();

  const clampedMaxResults = Math.max(1, Math.min(20, maxResults));

  const body = {
    textQuery: query,
    maxResultCount: clampedMaxResults,
    locationBias: {
      circle: {
        center: {
          latitude: locationBias.lat,
          longitude: locationBias.lng,
        },
        radius: locationBias.radiusMeters,
      },
    },
  };

  const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    // 429 = rate-limited; let callers handle retry logic.
    if (response.status === 429) {
      throw new Error(
        `Google Places API rate limited (429). Retry after a delay. Body: ${errorText}`
      );
    }
    throw new Error(
      `Google Places API error ${response.status}: ${errorText}`
    );
  }

  const data = (await response.json()) as RawGooglePlacesResponse;

  if (data.error) {
    throw new Error(
      `Google Places API error [${data.error.code}]: ${data.error.message}`
    );
  }

  if (!data.places || !Array.isArray(data.places)) {
    return [];
  }

  return data.places
    .map(parseRawPlace)
    .filter((p): p is GooglePlace => p !== null);
}

/**
 * Convert a raw API place object into the cleaned {@link GooglePlace} type.
 * Returns `null` for entries missing required fields (id, displayName).
 */
function parseRawPlace(raw: RawGooglePlace): GooglePlace | null {
  const id = raw.id;
  const displayName = raw.displayName?.text;

  // Both id and displayName are required — skip entries without them.
  if (!id || !displayName) return null;

  return {
    id,
    displayName,
    formattedAddress: raw.formattedAddress ?? "",
    latitude: raw.location?.latitude ?? 0,
    longitude: raw.location?.longitude ?? 0,
    rating: raw.rating ?? null,
    websiteUri: raw.websiteUri ?? null,
    googleMapsUri: raw.googleMapsUri ?? null,
    types: raw.types ?? [],
    photos: (raw.photos ?? [])
      .filter(
        (p): p is { name: string; widthPx: number; heightPx: number } =>
          !!p.name && typeof p.widthPx === "number" && typeof p.heightPx === "number"
      )
      .map((p) => ({
        name: p.name,
        widthPx: p.widthPx,
        heightPx: p.heightPx,
      })),
  };
}

// ---------------------------------------------------------------------------
// Venue upsert
// ---------------------------------------------------------------------------

/**
 * Upsert a venue from a Google Places result into the database.
 *
 * Deduplication strategy (in priority order):
 * 1. Match by `googlePlaceId` (exact, unique column).
 * 2. Match by normalised name + city (fuzzy, catches venues imported from
 *    other sources that lack a Google Place ID).
 * 3. Insert as a new venue with `source = 'google_places'`.
 *
 * @param place - A parsed Google Place object.
 * @returns The upserted venue record and whether it was created or updated.
 */
export async function upsertVenueFromGooglePlaces(
  place: GooglePlace
): Promise<UpsertResult> {
  const parsed = parseGoogleAddress(place.formattedAddress);

  // ---- 1. Check by googlePlaceId ----
  const existingByPlaceId = await db
    .select()
    .from(venues)
    .where(eq(venues.googlePlaceId, place.id))
    .limit(1);

  if (existingByPlaceId.length > 0) {
    const existing = existingByPlaceId[0];
    const updated = await db
      .update(venues)
      .set({
        name: place.displayName,
        address: parsed.address ?? existing.address,
        city: parsed.city ?? existing.city,
        state: parsed.state ?? existing.state,
        zipCode: parsed.zipCode ?? existing.zipCode,
        country: parsed.country ?? existing.country,
        latitude: place.latitude || existing.latitude,
        longitude: place.longitude || existing.longitude,
        website: place.websiteUri ?? existing.website,
        googleRating: place.rating !== null ? String(place.rating) : existing.googleRating,
        imageUrl: place.photos.length > 0 ? place.photos[0].name : existing.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(venues.id, existing.id))
      .returning();

    return { venue: updated[0], action: "updated" };
  }

  // ---- 2. Check by name + city proximity ----
  if (parsed.city) {
    const existingByName = await db
      .select()
      .from(venues)
      .where(
        and(
          ilike(venues.name, place.displayName),
          ilike(venues.city, parsed.city)
        )
      )
      .limit(1);

    if (existingByName.length > 0) {
      const existing = existingByName[0];
      const updated = await db
        .update(venues)
        .set({
          googlePlaceId: place.id,
          address: parsed.address ?? existing.address,
          city: parsed.city ?? existing.city,
          state: parsed.state ?? existing.state,
          zipCode: parsed.zipCode ?? existing.zipCode,
          country: parsed.country ?? existing.country,
          latitude: place.latitude || existing.latitude,
          longitude: place.longitude || existing.longitude,
          website: place.websiteUri ?? existing.website,
          googleRating:
            place.rating !== null ? String(place.rating) : existing.googleRating,
          imageUrl: place.photos.length > 0 ? place.photos[0].name : existing.imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(venues.id, existing.id))
        .returning();

      return { venue: updated[0], action: "updated" };
    }
  }

  // ---- 3. Insert new venue ----
  const id = createId();
  const baseSlug = slugify(place.displayName);
  // Ensure slug uniqueness by appending a short ID fragment.
  const slug = `${baseSlug}-${id.slice(0, 8)}`;

  const inserted = await db
    .insert(venues)
    .values({
      id,
      name: place.displayName,
      slug,
      address: parsed.address,
      city: parsed.city,
      state: parsed.state,
      zipCode: parsed.zipCode,
      country: parsed.country ?? "US",
      latitude: place.latitude || null,
      longitude: place.longitude || null,
      website: place.websiteUri,
      googlePlaceId: place.id,
      googleRating: place.rating !== null ? String(place.rating) : null,
      imageUrl: place.photos.length > 0 ? place.photos[0].name : null,
      source: "google_places",
      isVerified: false,
    })
    .returning();

  return { venue: inserted[0], action: "created" };
}

// ---------------------------------------------------------------------------
// Main discovery function
// ---------------------------------------------------------------------------

/**
 * Discover music venues across one or more metropolitan areas by searching
 * Google Places with a set of music-related queries.
 *
 * For each metro + query combination the function:
 * 1. Calls the Google Places Text Search API.
 * 2. Upserts each returned place into the `venues` table.
 * 3. Pauses between requests to respect rate limits.
 *
 * @param options - Discovery parameters. If `queries` is omitted the
 *   {@link VENUE_SEARCH_QUERIES default queries} are used.
 * @returns Aggregate statistics about the discovery run.
 *
 * @example
 * ```ts
 * const stats = await discoverVenues({
 *   metros: DEFAULT_METROS,
 * });
 * console.log(`Discovered ${stats.venuesNew} new venues`);
 * ```
 */
export async function discoverVenues(
  options: DiscoverVenuesOptions
): Promise<DiscoveryStats> {
  const { metros, queries = [...VENUE_SEARCH_QUERIES] } = options;

  const stats: DiscoveryStats = {
    venuesDiscovered: 0,
    venuesUpdated: 0,
    venuesNew: 0,
    errors: [],
  };

  // Track all Google Place IDs we've already processed in this run to avoid
  // redundant upserts when the same venue appears for multiple queries.
  const processedPlaceIds = new Set<string>();

  for (const metro of metros) {
    for (const query of queries) {
      try {
        console.log(
          `[google-places] Searching "${query}" in ${metro.name}...`
        );

        const places = await searchGooglePlaces({
          query,
          locationBias: {
            lat: metro.lat,
            lng: metro.lng,
            radiusMeters: metro.radiusMeters,
          },
        });

        console.log(
          `[google-places] Found ${places.length} results for "${query}" in ${metro.name}`
        );

        for (const place of places) {
          // Skip if we already processed this place in an earlier query.
          if (processedPlaceIds.has(place.id)) continue;
          processedPlaceIds.add(place.id);

          try {
            const { action } = await upsertVenueFromGooglePlaces(place);
            stats.venuesDiscovered++;

            if (action === "created") {
              stats.venuesNew++;
            } else {
              stats.venuesUpdated++;
            }
          } catch (upsertError) {
            const message =
              upsertError instanceof Error
                ? upsertError.message
                : String(upsertError);
            console.error(
              `[google-places] Failed to upsert venue "${place.displayName}": ${message}`
            );
            stats.errors.push(
              `Upsert failed for "${place.displayName}" (${place.id}): ${message}`
            );
          }
        }
      } catch (searchError) {
        const message =
          searchError instanceof Error
            ? searchError.message
            : String(searchError);
        console.error(
          `[google-places] Search failed for "${query}" in ${metro.name}: ${message}`
        );
        stats.errors.push(
          `Search failed for "${query}" in ${metro.name}: ${message}`
        );
      }

      // Delay between requests to stay within rate limits.
      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log(
    `[google-places] Discovery complete. ` +
      `New: ${stats.venuesNew}, Updated: ${stats.venuesUpdated}, ` +
      `Errors: ${stats.errors.length}`
  );

  return stats;
}
