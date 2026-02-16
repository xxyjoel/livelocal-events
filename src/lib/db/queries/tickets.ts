import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { ticketTypes, tickets, orders } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all ticket types for a given event, ordered by sort order.
 */
export async function getTicketTypesByEvent(eventId: string) {
  return db.query.ticketTypes.findMany({
    where: eq(ticketTypes.eventId, eventId),
    orderBy: ticketTypes.sortOrder,
  });
}

/**
 * Get all orders for a given user, including related event info.
 * Sorted by most recent first.
 */
export async function getOrdersByUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      event: {
        columns: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          imageUrl: true,
          thumbnailUrl: true,
        },
      },
    },
    orderBy: desc(orders.createdAt),
  });
}

/**
 * Get all tickets for a given user, including event and venue info.
 * Sorted by event start date descending (most recent first).
 */
export async function getTicketsByUser(userId: string) {
  return db.query.tickets.findMany({
    where: eq(tickets.userId, userId),
    with: {
      event: {
        columns: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          imageUrl: true,
          thumbnailUrl: true,
        },
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
        },
      },
      ticketType: {
        columns: {
          id: true,
          name: true,
          price: true,
        },
      },
      order: {
        columns: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: desc(tickets.createdAt),
  });
}

/**
 * Get a single ticket by its ID, with full relations (event, venue, ticket
 * type, order, user).
 */
export async function getTicketById(ticketId: string) {
  const result = await db.query.tickets.findFirst({
    where: eq(tickets.id, ticketId),
    with: {
      event: {
        with: {
          venue: true,
        },
      },
      ticketType: true,
      order: true,
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return result ?? null;
}
