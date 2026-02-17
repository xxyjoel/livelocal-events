"use server";

import { sql, eq, and, ilike, or, count, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, venues, categories, tickets } from "@/lib/db/schema";

/**
 * Get the total number of events.
 */
export async function getEventCount(): Promise<number> {
  const result = await db.select({ value: count() }).from(events);
  return result[0]?.value ?? 0;
}

/**
 * Get the total number of venues.
 */
export async function getVenueCount(): Promise<number> {
  const result = await db.select({ value: count() }).from(venues);
  return result[0]?.value ?? 0;
}

/**
 * Get the count of events with pending_review submission status.
 */
export async function getPendingSubmissionCount(): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(events)
    .where(eq(events.submissionStatus, "pending_review"));
  return result[0]?.value ?? 0;
}

/**
 * Get the total number of tickets sold (status = 'valid' or 'used').
 */
export async function getTotalTicketsSold(): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(tickets)
    .where(
      sql`${tickets.status} IN ('valid', 'used')`
    );
  return result[0]?.value ?? 0;
}

// ---------------------------------------------------------------------------
// Admin events listing with search, filter, and pagination
// ---------------------------------------------------------------------------

type EventStatus = typeof events.$inferInsert.status;

export interface AdminEventsFilters {
  q?: string;
  status?: string;
  limit?: number;
  page?: number;
}

export async function getAdminEvents(filters: AdminEventsFilters = {}) {
  const { q, status, limit = 50, page = 1 } = filters;
  const offset = (page - 1) * limit;

  const conditions: ReturnType<typeof eq>[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(events.title, `%${q}%`),
        ilike(events.description, `%${q}%`)
      )!
    );
  }

  if (status && status !== "all") {
    conditions.push(eq(events.status, status as NonNullable<EventStatus>));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.events.findMany({
      where: whereClause,
      with: {
        venue: { columns: { id: true, name: true, slug: true } },
        category: { columns: { id: true, name: true, slug: true } },
      },
      orderBy: desc(events.createdAt),
      limit,
      offset,
    }),
    db.select({ value: count() }).from(events).where(whereClause),
  ]);

  return { events: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}
