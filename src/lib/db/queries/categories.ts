import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all categories ordered by name.
 */
export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

/**
 * Get categories for select dropdowns (id + name only).
 */
export async function getCategoriesForSelect() {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(categories.name);
}
