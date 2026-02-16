import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get a user by their ID.
 */
export async function getUserById(id: string) {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Get a user by their email address.
 */
export async function getUserByEmail(email: string) {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Update a user's role.
 */
export async function updateUserRole(
  id: string,
  role: "user" | "promoter" | "admin"
) {
  const results = await db
    .update(users)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return results[0] ?? null;
}
