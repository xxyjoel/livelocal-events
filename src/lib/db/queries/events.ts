import { eq, and, or, desc, asc, sql, ilike } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { events, venues, categories } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventInsert = typeof events.$inferInsert;
type EventStatus = EventInsert["status"];

interface GetEventsOptions {
  limit?: number;
  offset?: number;
  status?: EventStatus;
  categoryId?: string;
  venueId?: string;
}

interface GetEventsNearbyFilters {
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

interface SearchEventsFilters {
  categoryId?: string;
  status?: EventStatus;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List events with optional pagination and filters.
 */
export async function getEvents(options: GetEventsOptions = {}) {
  const { limit = 20, offset = 0, status, categoryId, venueId } = options;

  const conditions = [];

  if (status) {
    conditions.push(eq(events.status, status));
  }
  if (categoryId) {
    conditions.push(eq(events.categoryId, categoryId));
  }
  if (venueId) {
    conditions.push(eq(events.venueId, venueId));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(events)
    .where(whereClause)
    .orderBy(desc(events.startDate))
    .limit(limit)
    .offset(offset);
}

/**
 * List events with venue and category relations (for admin pages).
 */
export async function getEventsWithRelations(options: GetEventsOptions = {}) {
  const { limit = 50, offset = 0, status, categoryId, venueId } = options;

  const conditions = [];

  if (status) {
    conditions.push(eq(events.status, status));
  }
  if (categoryId) {
    conditions.push(eq(events.categoryId, categoryId));
  }
  if (venueId) {
    conditions.push(eq(events.venueId, venueId));
  }

  return db.query.events.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      venue: {
        columns: { id: true, name: true, slug: true },
      },
      category: {
        columns: { id: true, name: true, slug: true },
      },
    },
    orderBy: desc(events.startDate),
    limit,
    offset,
  });
}

/**
 * Get a single event by ID, with venue and category relations.
 */
export async function getEventById(id: string) {
  const result = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      venue: true,
      category: true,
    },
  });

  return result ?? null;
}

/**
 * Get an event by slug with full relations (venue, category, artists).
 */
export async function getEventBySlug(slug: string) {
  const result = await db.query.events.findFirst({
    where: eq(events.slug, slug),
    with: {
      venue: true,
      category: true,
      eventArtists: {
        with: {
          artist: true,
        },
        orderBy: (eventArtists, { asc }) => [asc(eventArtists.sortOrder)],
      },
    },
  });

  return result ?? null;
}

/**
 * Insert a new event. The slug is auto-generated from the title unless
 * explicitly provided.
 */
export async function createEvent(
  data: Omit<EventInsert, "id" | "slug" | "createdAt" | "updatedAt"> & {
    slug?: string;
  }
) {
  const id = createId();
  const slug = data.slug ?? slugify(data.title);

  const results = await db
    .insert(events)
    .values({
      ...data,
      id,
      slug,
    })
    .returning();

  return results[0];
}

/**
 * Update an existing event by ID.
 */
export async function updateEvent(
  id: string,
  data: Partial<Omit<EventInsert, "id" | "createdAt">>
) {
  const results = await db
    .update(events)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();

  return results[0] ?? null;
}

/**
 * Delete an event by ID.
 */
export async function deleteEvent(id: string) {
  const results = await db
    .delete(events)
    .where(eq(events.id, id))
    .returning();

  return results[0] ?? null;
}

/**
 * Get featured, published events.
 */
export async function getFeaturedEvents(limit: number = 6) {
  return db.query.events.findMany({
    where: and(
      eq(events.status, "published"),
      eq(events.isFeatured, true)
    ),
    with: {
      venue: {
        columns: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
        },
      },
      category: true,
    },
    orderBy: asc(events.startDate),
    limit,
  });
}

/**
 * Find published events near a geographic point using the Haversine formula.
 *
 * NOTE: This uses the Haversine formula for distance calculation which works
 * well for moderate result sets. When PostGIS is available, consider upgrading
 * to ST_DWithin + ST_Distance for better performance on large datasets with
 * spatial indexing (GiST index on a geography column).
 */
export async function getEventsNearby(
  lat: number,
  lng: number,
  radiusKm: number,
  filters: GetEventsNearbyFilters = {}
) {
  const { categoryId, dateFrom, dateTo, limit = 20, offset = 0 } = filters;

  // Build optional filter clauses
  const categoryClause = categoryId
    ? sql`AND c.id = ${categoryId}`
    : sql``;

  const dateFromClause = dateFrom
    ? sql`AND e.start_date >= ${dateFrom.toISOString()}`
    : sql`AND e.start_date >= NOW()`;

  const dateToClause = dateTo
    ? sql`AND e.start_date <= ${dateTo.toISOString()}`
    : sql``;

  const result = await db.execute(sql`
    SELECT
      e.*,
      v.name   AS venue_name,
      v.slug   AS venue_slug,
      v.city,
      v.state,
      c.name   AS category_name,
      c.slug   AS category_slug,
      c.icon   AS category_icon,
      ROUND((
        6371 * acos(
          cos(radians(${lat})) * cos(radians(e.latitude)) *
          cos(radians(e.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(e.latitude))
        )
      )::numeric, 1) AS distance_km
    FROM events e
    LEFT JOIN venues v     ON e.venue_id = v.id
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.status = 'published'
      ${dateFromClause}
      ${dateToClause}
      AND e.latitude IS NOT NULL
      AND e.longitude IS NOT NULL
      AND (
        6371 * acos(
          cos(radians(${lat})) * cos(radians(e.latitude)) *
          cos(radians(e.longitude) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(e.latitude))
        )
      ) <= ${radiusKm}
      ${categoryClause}
    ORDER BY distance_km ASC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return result.rows;
}

/**
 * Get published events belonging to a category (by category slug).
 */
export async function getEventsByCategory(
  categorySlug: string,
  limit: number = 20
) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, categorySlug),
  });

  if (!category) {
    return [];
  }

  return db.query.events.findMany({
    where: and(
      eq(events.categoryId, category.id),
      eq(events.status, "published")
    ),
    with: {
      venue: {
        columns: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
        },
      },
      category: true,
    },
    orderBy: asc(events.startDate),
    limit,
  });
}

/**
 * Full-text search on events using ILIKE for MVP.
 * Searches across event title and description.
 */
export async function searchEvents(
  query: string,
  filters: SearchEventsFilters = {}
) {
  const { categoryId, status = "published", limit = 20, offset = 0 } = filters;

  const conditions = [
    or(
      ilike(events.title, `%${query}%`),
      ilike(events.description, `%${query}%`)
    ),
  ];

  if (status) {
    conditions.push(eq(events.status, status));
  }
  if (categoryId) {
    conditions.push(eq(events.categoryId, categoryId));
  }

  return db
    .select({
      event: events,
      venueName: venues.name,
      venueSlug: venues.slug,
      venueCity: venues.city,
      venueState: venues.state,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryIcon: categories.icon,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(categories, eq(events.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(events.startDate))
    .limit(limit)
    .offset(offset);
}

/**
 * Get upcoming published events sorted by start date.
 */
export async function getUpcomingEvents(limit: number = 10) {
  return db.query.events.findMany({
    where: and(
      eq(events.status, "published"),
      sql`${events.startDate} >= NOW()`
    ),
    with: {
      venue: {
        columns: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
        },
      },
      category: true,
    },
    orderBy: asc(events.startDate),
    limit,
  });
}

/**
 * Update event status (published, draft, cancelled, etc.).
 */
export async function updateEventStatus(id: string, status: EventStatus) {
  const results = await db
    .update(events)
    .set({ status, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();

  return results[0] ?? null;
}

/**
 * Update event submission status and optional moderation note.
 */
export async function updateEventSubmission(
  id: string,
  data: {
    submissionStatus?: typeof events.$inferInsert.submissionStatus;
    moderationNote?: string;
    status?: EventStatus;
  }
) {
  const results = await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();

  return results[0] ?? null;
}

/**
 * Get events with a pending submission status for moderation.
 */
export async function getPendingSubmissions() {
  return db.query.events.findMany({
    where: eq(events.submissionStatus, "pending_review"),
    with: {
      venue: {
        columns: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
        },
      },
      category: true,
      organizer: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      submitter: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: asc(events.createdAt),
  });
}
