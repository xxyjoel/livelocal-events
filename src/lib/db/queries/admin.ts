"use server";

import { sql, eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, venues, tickets } from "@/lib/db/schema";

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
