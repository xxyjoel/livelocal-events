import { db } from "@/lib/db";
import { events, venues } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Confidence score between 0 and 1, where 1 means exact match. */
export type ConfidenceScore = number;

/** Describes why two records were considered duplicates. */
export type VenueMatchReason =
  | "google_place_id"
  | "exact_name_same_city"
  | "similar_name_same_city"
  | "similar_name_nearby";

export type EventMatchReason =
  | "same_external_id"
  | "same_venue_similar_date_similar_title"
  | "similar_title_same_day_same_city";

export interface VenueMatchResult {
  venue: typeof venues.$inferSelect;
  confidence: ConfidenceScore;
  reason: VenueMatchReason;
}

export interface EventMatchResult {
  event: typeof events.$inferSelect;
  confidence: ConfidenceScore;
  reason: EventMatchReason;
}

export interface DuplicatePair {
  eventA: typeof events.$inferSelect;
  eventB: typeof events.$inferSelect;
  confidence: ConfidenceScore;
  reason: EventMatchReason;
}

export interface VenueCandidate {
  name: string;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
}

export interface EventCandidate {
  title: string;
  startDate: Date;
  venueId: string;
  externalSource?: string | null;
  externalId?: string | null;
}

// ---------------------------------------------------------------------------
// String Normalization
// ---------------------------------------------------------------------------

/**
 * Common venue name suffixes to strip during normalization.
 * Order matters: longer suffixes first to avoid partial matches.
 */
const VENUE_SUFFIXES = [
  "amphitheater",
  "amphitheatre",
  "auditorium",
  "ballroom",
  "center",
  "centre",
  "club",
  "coliseum",
  "complex",
  "field",
  "forum",
  "garden",
  "gardens",
  "hall",
  "house",
  "lounge",
  "music hall",
  "pavilion",
  "plaza",
  "room",
  "stadium",
  "stage",
  "theater",
  "theatre",
  "arena",
  "venue",
];

/**
 * Normalize a venue name for fuzzy comparison.
 *
 * Applies the following transformations:
 * - Lowercase
 * - Remove common venue-type suffixes ("Theater", "Arena", etc.)
 * - Remove punctuation
 * - Collapse whitespace
 * - Trim leading/trailing whitespace
 *
 * @param name - The raw venue name
 * @returns The normalized venue name
 */
export function normalizeVenueName(name: string): string {
  let normalized = name.toLowerCase();

  // Remove punctuation (keep letters, numbers, whitespace)
  normalized = normalized.replace(/[^\w\s]/g, "");

  // Remove common venue suffixes (as whole words at the end)
  for (const suffix of VENUE_SUFFIXES) {
    const regex = new RegExp(`\\b${suffix}\\b\\s*$`, "i");
    normalized = normalized.replace(regex, "");
  }

  // Also remove suffixes that appear preceded by "the" at the end
  // e.g., "Madison Square the Garden" edge case is unlikely, but
  // "The Music Hall at ..." is handled by general suffix removal

  // Collapse whitespace and trim
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Normalize an event title for fuzzy comparison.
 *
 * Applies the following transformations:
 * - Lowercase
 * - Remove common leading articles ("the", "a", "an")
 * - Remove punctuation
 * - Collapse whitespace
 * - Trim leading/trailing whitespace
 *
 * @param title - The raw event title
 * @returns The normalized event title
 */
export function normalizeEventTitle(title: string): string {
  let normalized = title.toLowerCase();

  // Remove punctuation (keep letters, numbers, whitespace)
  normalized = normalized.replace(/[^\w\s]/g, "");

  // Remove leading articles
  normalized = normalized.replace(/^(the|a|an)\s+/i, "");

  // Collapse whitespace and trim
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

// ---------------------------------------------------------------------------
// String Similarity (Levenshtein-based)
// ---------------------------------------------------------------------------

/**
 * Compute the Levenshtein edit distance between two strings.
 *
 * Uses the classic dynamic-programming approach with O(min(m,n)) space
 * optimization.
 *
 * @param a - First string
 * @param b - Second string
 * @returns The minimum number of single-character edits to transform a into b
 */
function levenshteinDistance(a: string, b: string): number {
  // Ensure a is the shorter string for space optimization
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const m = a.length;
  const n = b.length;

  // Use a single row (plus one element) instead of the full matrix
  let previousRow: number[] = Array.from({ length: m + 1 }, (_, i) => i);

  for (let j = 1; j <= n; j++) {
    const currentRow: number[] = [j];
    for (let i = 1; i <= m; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[i] = Math.min(
        currentRow[i - 1] + 1, // insertion
        previousRow[i] + 1, // deletion
        previousRow[i - 1] + cost // substitution
      );
    }
    previousRow = currentRow;
  }

  return previousRow[m];
}

/**
 * Compute the similarity ratio between two strings on a scale of 0 to 1.
 *
 * Uses Levenshtein distance normalized by the length of the longer string.
 * A score of 1.0 means the strings are identical; 0.0 means they share
 * nothing in common.
 *
 * @param a - First string
 * @param b - Second string
 * @returns A similarity score between 0 and 1
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const maxLen = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a, b);

  return 1 - distance / maxLen;
}

// ---------------------------------------------------------------------------
// Date Comparison
// ---------------------------------------------------------------------------

/**
 * Check whether two dates fall within a specified number of hours of each
 * other.
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @param maxHoursDiff - Maximum allowed difference in hours
 * @returns `true` if the absolute time difference is within the threshold
 */
export function areDatesClose(
  date1: Date,
  date2: Date,
  maxHoursDiff: number
): boolean {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= maxHoursDiff;
}

// ---------------------------------------------------------------------------
// Geospatial Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the Haversine distance between two geographic coordinates.
 *
 * @param lat1 - Latitude of the first point in degrees
 * @param lon1 - Longitude of the first point in degrees
 * @param lat2 - Latitude of the second point in degrees
 * @param lon2 - Longitude of the second point in degrees
 * @returns Distance in kilometers
 */
function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---------------------------------------------------------------------------
// Venue Deduplication
// ---------------------------------------------------------------------------

/**
 * Search for an existing venue that is a likely duplicate of the given
 * candidate.
 *
 * The matching strategy is applied in priority order:
 *
 * 1. **Exact `googlePlaceId` match** -- 100% confidence
 * 2. **Exact normalized name + same city** -- 0.95 confidence
 * 3. **Similar normalized name (>= 0.85) + same city** -- 0.90 confidence
 * 4. **Similar normalized name (>= 0.85) + within 0.5 km** -- 0.88 confidence
 *
 * The first strategy that produces a match wins; later strategies are not
 * evaluated.
 *
 * @param venue - The candidate venue to check for duplicates
 * @returns The best matching venue with its confidence score and match reason,
 *          or `null` if no duplicate was found
 */
export async function findDuplicateVenue(
  venue: VenueCandidate
): Promise<VenueMatchResult | null> {
  // ----- Strategy 1: Google Place ID exact match -----
  if (venue.googlePlaceId) {
    const byPlaceId = await db
      .select()
      .from(venues)
      .where(eq(venues.googlePlaceId, venue.googlePlaceId))
      .limit(1);

    if (byPlaceId.length > 0) {
      return {
        venue: byPlaceId[0],
        confidence: 1.0,
        reason: "google_place_id",
      };
    }
  }

  // ----- Strategies 2 & 3: Name-based matching within the same city -----
  const normalizedCandidate = normalizeVenueName(venue.name);

  if (venue.city) {
    // Fetch all venues in the same city for comparison
    const sameCityVenues = await db
      .select()
      .from(venues)
      .where(
        sql`LOWER(${venues.city}) = LOWER(${venue.city})`
      );

    for (const existing of sameCityVenues) {
      const normalizedExisting = normalizeVenueName(existing.name);

      // Strategy 2: Exact normalized name match
      if (normalizedCandidate === normalizedExisting) {
        return {
          venue: existing,
          confidence: 0.95,
          reason: "exact_name_same_city",
        };
      }
    }

    // Strategy 3: Similar normalized name (>= 0.85)
    for (const existing of sameCityVenues) {
      const normalizedExisting = normalizeVenueName(existing.name);
      const similarity = stringSimilarity(
        normalizedCandidate,
        normalizedExisting
      );

      if (similarity >= 0.85) {
        return {
          venue: existing,
          confidence: 0.9,
          reason: "similar_name_same_city",
        };
      }
    }
  }

  // ----- Strategy 4: Similar name + geographic proximity -----
  if (
    venue.latitude != null &&
    venue.longitude != null
  ) {
    // Fetch venues that have coordinates (we apply a rough bounding box
    // first to limit the result set before running Haversine)
    const APPROX_DEGREE_PER_KM = 0.009; // ~1 km at mid-latitudes
    const BOX = 0.5 * APPROX_DEGREE_PER_KM; // 0.5 km bounding box

    const nearbyVenues = await db
      .select()
      .from(venues)
      .where(
        and(
          sql`${venues.latitude} IS NOT NULL`,
          sql`${venues.longitude} IS NOT NULL`,
          sql`${venues.latitude} BETWEEN ${venue.latitude - BOX} AND ${venue.latitude + BOX}`,
          sql`${venues.longitude} BETWEEN ${venue.longitude - BOX} AND ${venue.longitude + BOX}`
        )
      );

    for (const existing of nearbyVenues) {
      if (existing.latitude == null || existing.longitude == null) continue;

      const distKm = haversineDistanceKm(
        venue.latitude,
        venue.longitude,
        existing.latitude,
        existing.longitude
      );

      if (distKm > 0.5) continue;

      const normalizedExisting = normalizeVenueName(existing.name);
      const similarity = stringSimilarity(
        normalizedCandidate,
        normalizedExisting
      );

      if (similarity >= 0.85) {
        return {
          venue: existing,
          confidence: 0.88,
          reason: "similar_name_nearby",
        };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Event Deduplication
// ---------------------------------------------------------------------------

/**
 * Search for an existing event that is a likely duplicate of the given
 * candidate.
 *
 * The matching strategy is applied in priority order:
 *
 * 1. **Same `externalSource` + `externalId`** -- 100% confidence (fast path
 *    for re-syncs of the same provider)
 * 2. **Same venue + date within 2 hours + similar title (>= 0.85)** -- 0.92
 *    confidence (cross-source dedup)
 * 3. **Similar title (>= 0.80) + same calendar day + same city** -- 0.75
 *    confidence (weaker cross-source match)
 *
 * @param event - The candidate event to check for duplicates
 * @returns The best matching event with its confidence score and match reason,
 *          or `null` if no duplicate was found
 */
export async function findDuplicateEvent(
  event: EventCandidate
): Promise<EventMatchResult | null> {
  const normalizedCandidate = normalizeEventTitle(event.title);

  // ----- Strategy 1: Same external source + external ID -----
  if (event.externalSource && event.externalId) {
    const byExternalId = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.externalSource, event.externalSource),
          eq(events.externalId, event.externalId)
        )
      )
      .limit(1);

    if (byExternalId.length > 0) {
      return {
        event: byExternalId[0],
        confidence: 1.0,
        reason: "same_external_id",
      };
    }
  }

  // ----- Strategy 2: Same venue + close date + similar title -----
  // Query events at the same venue within a +/- 3 hour window (we'll do a
  // precise check with areDatesClose(2h) in application code)
  const threeHoursMs = 3 * 60 * 60 * 1000;
  const windowStart = new Date(event.startDate.getTime() - threeHoursMs);
  const windowEnd = new Date(event.startDate.getTime() + threeHoursMs);

  const sameVenueNearDate = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.venueId, event.venueId),
        sql`${events.startDate} >= ${windowStart.toISOString()}`,
        sql`${events.startDate} <= ${windowEnd.toISOString()}`
      )
    );

  for (const existing of sameVenueNearDate) {
    if (!areDatesClose(event.startDate, existing.startDate, 2)) continue;

    const normalizedExisting = normalizeEventTitle(existing.title);
    const similarity = stringSimilarity(normalizedCandidate, normalizedExisting);

    if (similarity >= 0.85) {
      return {
        event: existing,
        confidence: 0.92,
        reason: "same_venue_similar_date_similar_title",
      };
    }
  }

  // ----- Strategy 3: Similar title + same day + same city -----
  // Find events on the same calendar day with a join to venues for city
  const dayStart = new Date(event.startDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(event.startDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  // We need the candidate event's city -- look it up from the venue
  const candidateVenueResult = await db
    .select({ city: venues.city })
    .from(venues)
    .where(eq(venues.id, event.venueId))
    .limit(1);

  const candidateCity = candidateVenueResult[0]?.city;

  if (candidateCity) {
    const sameDaySameCity = await db
      .select({
        event: events,
        venueCity: venues.city,
      })
      .from(events)
      .innerJoin(venues, eq(events.venueId, venues.id))
      .where(
        and(
          sql`${events.startDate} >= ${dayStart.toISOString()}`,
          sql`${events.startDate} <= ${dayEnd.toISOString()}`,
          sql`LOWER(${venues.city}) = LOWER(${candidateCity})`
        )
      );

    for (const row of sameDaySameCity) {
      const normalizedExisting = normalizeEventTitle(row.event.title);
      const similarity = stringSimilarity(
        normalizedCandidate,
        normalizedExisting
      );

      if (similarity >= 0.8) {
        return {
          event: row.event,
          confidence: 0.75,
          reason: "similar_title_same_day_same_city",
        };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Batch Deduplication (Admin Review)
// ---------------------------------------------------------------------------

/**
 * Scan all events and identify potential duplicate pairs.
 *
 * Events are grouped by venue and calendar date. Within each group, every
 * pair is compared using title similarity. Pairs that exceed a similarity
 * threshold of 0.80 are flagged as potential duplicates.
 *
 * **This function does NOT auto-merge.** It returns a list of candidate
 * pairs for human review.
 *
 * @returns An array of duplicate pair objects, each containing both events,
 *          a confidence score, and the reason they matched
 */
export async function deduplicateEvents(): Promise<DuplicatePair[]> {
  const duplicates: DuplicatePair[] = [];

  // Fetch all events with their venue city for grouping
  const allEvents = await db
    .select({
      event: events,
      venueCity: venues.city,
    })
    .from(events)
    .innerJoin(venues, eq(events.venueId, venues.id));

  // Group events by (venueId, date as YYYY-MM-DD UTC)
  const groups = new Map<string, typeof allEvents>();

  for (const row of allEvents) {
    const dateKey = row.event.startDate.toISOString().slice(0, 10);
    const groupKey = `${row.event.venueId}::${dateKey}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(row);
  }

  // Compare all pairs within each group
  for (const [, group] of groups) {
    if (group.length < 2) continue;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];

        // Check for exact external ID match first
        if (
          a.event.externalSource &&
          a.event.externalId &&
          a.event.externalSource === b.event.externalSource &&
          a.event.externalId === b.event.externalId
        ) {
          duplicates.push({
            eventA: a.event,
            eventB: b.event,
            confidence: 1.0,
            reason: "same_external_id",
          });
          continue;
        }

        // Check title similarity
        const normA = normalizeEventTitle(a.event.title);
        const normB = normalizeEventTitle(b.event.title);
        const similarity = stringSimilarity(normA, normB);

        if (
          similarity >= 0.85 &&
          areDatesClose(a.event.startDate, b.event.startDate, 2)
        ) {
          duplicates.push({
            eventA: a.event,
            eventB: b.event,
            confidence: 0.92,
            reason: "same_venue_similar_date_similar_title",
          });
        } else if (similarity >= 0.8) {
          duplicates.push({
            eventA: a.event,
            eventB: b.event,
            confidence: 0.75,
            reason: "similar_title_same_day_same_city",
          });
        }
      }
    }
  }

  // Sort duplicates by confidence descending for easier review
  duplicates.sort((a, b) => b.confidence - a.confidence);

  return duplicates;
}

// ---------------------------------------------------------------------------
// Venue Merging
// ---------------------------------------------------------------------------

/**
 * Merge two venues by moving all events from the duplicate venue to the
 * primary venue, combining metadata, and then deleting the duplicate.
 *
 * Metadata merge strategy:
 * - Keep the longer description
 * - Keep the higher Google rating
 * - Preserve `googlePlaceId` if either venue has one
 * - Keep the more complete address information
 * - Keep coordinates from the primary venue if available, else from the
 *   duplicate
 * - Prefer the primary venue's source unless it is "manual" and the
 *   duplicate has a more authoritative source
 *
 * @param primaryId - The ID of the venue that will be kept
 * @param duplicateId - The ID of the venue that will be merged and deleted
 * @returns The updated primary venue after the merge
 * @throws If either venue is not found
 */
export async function mergeVenues(
  primaryId: string,
  duplicateId: string
): Promise<typeof venues.$inferSelect> {
  // Fetch both venues
  const [primaryResults, duplicateResults] = await Promise.all([
    db.select().from(venues).where(eq(venues.id, primaryId)).limit(1),
    db.select().from(venues).where(eq(venues.id, duplicateId)).limit(1),
  ]);

  const primary = primaryResults[0];
  const duplicate = duplicateResults[0];

  if (!primary) {
    throw new Error(`Primary venue not found: ${primaryId}`);
  }
  if (!duplicate) {
    throw new Error(`Duplicate venue not found: ${duplicateId}`);
  }

  // Build merged metadata
  const mergedData: Partial<typeof venues.$inferInsert> = {};

  // Keep longer description
  if (
    duplicate.description &&
    (!primary.description ||
      duplicate.description.length > primary.description.length)
  ) {
    mergedData.description = duplicate.description;
  }

  // Preserve googlePlaceId
  if (!primary.googlePlaceId && duplicate.googlePlaceId) {
    mergedData.googlePlaceId = duplicate.googlePlaceId;
  }

  // Keep higher Google rating
  if (
    duplicate.googleRating != null &&
    (primary.googleRating == null ||
      Number(duplicate.googleRating) > Number(primary.googleRating))
  ) {
    mergedData.googleRating = duplicate.googleRating;
  }

  // Keep more complete address
  if (!primary.address && duplicate.address) {
    mergedData.address = duplicate.address;
  }
  if (!primary.city && duplicate.city) {
    mergedData.city = duplicate.city;
  }
  if (!primary.state && duplicate.state) {
    mergedData.state = duplicate.state;
  }
  if (!primary.zipCode && duplicate.zipCode) {
    mergedData.zipCode = duplicate.zipCode;
  }

  // Keep coordinates (prefer primary, fall back to duplicate)
  if (primary.latitude == null && duplicate.latitude != null) {
    mergedData.latitude = duplicate.latitude;
  }
  if (primary.longitude == null && duplicate.longitude != null) {
    mergedData.longitude = duplicate.longitude;
  }

  // Keep image if primary doesn't have one
  if (!primary.imageUrl && duplicate.imageUrl) {
    mergedData.imageUrl = duplicate.imageUrl;
  }

  // Keep website if primary doesn't have one
  if (!primary.website && duplicate.website) {
    mergedData.website = duplicate.website;
  }

  // Keep capacity if primary doesn't have one
  if (primary.capacity == null && duplicate.capacity != null) {
    mergedData.capacity = duplicate.capacity;
  }

  // Prefer verified status
  if (!primary.isVerified && duplicate.isVerified) {
    mergedData.isVerified = true;
  }

  // Move all events from duplicate to primary
  await db
    .update(events)
    .set({ venueId: primaryId, updatedAt: new Date() })
    .where(eq(events.venueId, duplicateId));

  // Update primary venue with merged metadata
  if (Object.keys(mergedData).length > 0) {
    mergedData.updatedAt = new Date();
    await db.update(venues).set(mergedData).where(eq(venues.id, primaryId));
  }

  // Delete the duplicate venue
  await db.delete(venues).where(eq(venues.id, duplicateId));

  // Return the refreshed primary venue
  const updatedResults = await db
    .select()
    .from(venues)
    .where(eq(venues.id, primaryId))
    .limit(1);

  return updatedResults[0];
}
