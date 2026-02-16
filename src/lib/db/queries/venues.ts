import { eq, ilike, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { venues } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VenueInsert = typeof venues.$inferInsert;

interface GetVenuesOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List venues with optional pagination and search by name.
 */
export async function getVenues(options: GetVenuesOptions = {}) {
  const { limit = 20, offset = 0, search } = options;

  const query = db
    .select()
    .from(venues)
    .orderBy(asc(venues.name))
    .limit(limit)
    .offset(offset);

  if (search) {
    return query.where(ilike(venues.name, `%${search}%`));
  }

  return query;
}

/**
 * Get a single venue by its ID.
 */
export async function getVenueById(id: string) {
  const results = await db
    .select()
    .from(venues)
    .where(eq(venues.id, id))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Get a single venue by its slug.
 */
export async function getVenueBySlug(slug: string) {
  const results = await db
    .select()
    .from(venues)
    .where(eq(venues.slug, slug))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Insert a new venue. The slug is auto-generated from the name unless
 * explicitly provided in `data`.
 */
export async function createVenue(
  data: Omit<VenueInsert, "id" | "slug" | "createdAt" | "updatedAt"> & {
    slug?: string;
  }
) {
  const id = createId();
  const slug = data.slug ?? slugify(data.name);

  const results = await db
    .insert(venues)
    .values({
      ...data,
      id,
      slug,
    })
    .returning();

  return results[0];
}

/**
 * Update an existing venue by ID.
 */
export async function updateVenue(
  id: string,
  data: Partial<Omit<VenueInsert, "id" | "createdAt">>
) {
  const results = await db
    .update(venues)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(venues.id, id))
    .returning();

  return results[0] ?? null;
}

/**
 * Delete a venue by ID.
 */
export async function deleteVenue(id: string) {
  const results = await db
    .delete(venues)
    .where(eq(venues.id, id))
    .returning();

  return results[0] ?? null;
}

/**
 * Get venues for select dropdowns (id + name only).
 */
export async function getVenuesForSelect() {
  return db
    .select({ id: venues.id, name: venues.name })
    .from(venues)
    .orderBy(asc(venues.name));
}

/**
 * Search venues by name -- intended for autocomplete / typeahead use cases.
 */
export async function searchVenues(query: string, limit: number = 10) {
  return db
    .select({
      id: venues.id,
      name: venues.name,
      slug: venues.slug,
      city: venues.city,
      state: venues.state,
    })
    .from(venues)
    .where(ilike(venues.name, `%${query}%`))
    .orderBy(asc(venues.name))
    .limit(limit);
}
