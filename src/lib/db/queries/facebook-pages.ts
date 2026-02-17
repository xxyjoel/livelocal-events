import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { facebookPages } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FacebookPageInsert = typeof facebookPages.$inferInsert;
type FacebookPageStatus = FacebookPageInsert["status"];

interface GetFacebookPagesOptions {
  status?: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * List all Facebook pages, optionally filtered by status.
 */
export async function getFacebookPages(opts: GetFacebookPagesOptions = {}) {
  const validStatuses = [
    "active",
    "paused",
    "failed",
    "pending_review",
  ] as const;

  if (
    opts.status &&
    validStatuses.includes(opts.status as (typeof validStatuses)[number])
  ) {
    return db.query.facebookPages.findMany({
      where: eq(
        facebookPages.status,
        opts.status as (typeof validStatuses)[number]
      ),
      with: {
        venue: {
          columns: { id: true, name: true, slug: true },
        },
      },
      orderBy: (fp, { desc }) => [desc(fp.createdAt)],
    });
  }

  return db.query.facebookPages.findMany({
    with: {
      venue: {
        columns: { id: true, name: true, slug: true },
      },
    },
    orderBy: (fp, { desc }) => [desc(fp.createdAt)],
  });
}

/**
 * Get a single Facebook page by its ID.
 */
export async function getFacebookPageById(id: string) {
  const result = await db.query.facebookPages.findFirst({
    where: eq(facebookPages.id, id),
    with: {
      venue: {
        columns: { id: true, name: true, slug: true },
      },
    },
  });

  return result ?? null;
}

/**
 * Insert a new Facebook page.
 */
export async function createFacebookPage(
  data: Omit<FacebookPageInsert, "id" | "createdAt" | "updatedAt">
) {
  const id = createId();

  const results = await db
    .insert(facebookPages)
    .values({
      ...data,
      id,
    })
    .returning();

  return results[0];
}

/**
 * Update an existing Facebook page by ID.
 */
export async function updateFacebookPage(
  id: string,
  data: Partial<Omit<FacebookPageInsert, "id" | "createdAt">>
) {
  const results = await db
    .update(facebookPages)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(facebookPages.id, id))
    .returning();

  return results[0] ?? null;
}

/**
 * Delete a Facebook page by ID.
 */
export async function deleteFacebookPage(id: string) {
  const results = await db
    .delete(facebookPages)
    .where(eq(facebookPages.id, id))
    .returning();

  return results[0] ?? null;
}

/**
 * Link a Facebook page to a venue by setting the venueId.
 */
export async function linkFacebookPageToVenue(
  pageId: string,
  venueId: string
) {
  const results = await db
    .update(facebookPages)
    .set({
      venueId,
      updatedAt: new Date(),
    })
    .where(eq(facebookPages.id, pageId))
    .returning();

  return results[0] ?? null;
}
