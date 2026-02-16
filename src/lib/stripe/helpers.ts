import { db } from "@/lib/db";
import { ticketTypes } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";

export type TicketItem = {
  ticketTypeId: string;
  quantity: number;
};

/**
 * Atomically reserve tickets by incrementing the `sold` count on each ticket type.
 * Uses an atomic UPDATE with a WHERE guard so we never oversell:
 *   UPDATE ticket_types SET sold = sold + qty WHERE id = ? AND sold + qty <= quantity
 * Returns { success: true } if all items reserved, or { success: false, failedItem } if any fail.
 * On failure, previously reserved items in this batch are automatically released.
 */
export async function reserveTickets(
  items: TicketItem[]
): Promise<
  { success: true } | { success: false; failedTicketTypeId: string; reason: string }
> {
  const reserved: TicketItem[] = [];

  for (const item of items) {
    // First, check sales window
    const [ticketType] = await db
      .select({
        id: ticketTypes.id,
        salesStart: ticketTypes.salesStart,
        salesEnd: ticketTypes.salesEnd,
        quantity: ticketTypes.quantity,
        sold: ticketTypes.sold,
        maxPerOrder: ticketTypes.maxPerOrder,
      })
      .from(ticketTypes)
      .where(eq(ticketTypes.id, item.ticketTypeId));

    if (!ticketType) {
      // Roll back previously reserved
      await releaseTickets(reserved);
      return {
        success: false,
        failedTicketTypeId: item.ticketTypeId,
        reason: "Ticket type not found",
      };
    }

    // Check max per order
    if (item.quantity > ticketType.maxPerOrder) {
      await releaseTickets(reserved);
      return {
        success: false,
        failedTicketTypeId: item.ticketTypeId,
        reason: `Maximum ${ticketType.maxPerOrder} tickets per order`,
      };
    }

    // Check sales window
    const now = new Date();
    if (ticketType.salesStart && now < ticketType.salesStart) {
      await releaseTickets(reserved);
      return {
        success: false,
        failedTicketTypeId: item.ticketTypeId,
        reason: "Sales have not started yet",
      };
    }
    if (ticketType.salesEnd && now > ticketType.salesEnd) {
      await releaseTickets(reserved);
      return {
        success: false,
        failedTicketTypeId: item.ticketTypeId,
        reason: "Sales have ended",
      };
    }

    // Atomic update: only succeeds if there's enough inventory
    const result = await db
      .update(ticketTypes)
      .set({
        sold: sql`${ticketTypes.sold} + ${item.quantity}`,
      })
      .where(
        and(
          eq(ticketTypes.id, item.ticketTypeId),
          sql`${ticketTypes.sold} + ${item.quantity} <= ${ticketTypes.quantity}`
        )
      )
      .returning({ id: ticketTypes.id });

    if (result.length === 0) {
      // Could not reserve — roll back everything already reserved
      await releaseTickets(reserved);
      return {
        success: false,
        failedTicketTypeId: item.ticketTypeId,
        reason: "Not enough tickets available",
      };
    }

    reserved.push(item);
  }

  return { success: true };
}

/**
 * Release previously reserved tickets by decrementing the `sold` count.
 * Used when a checkout session expires or is cancelled, or on partial reservation failure.
 * Uses sql`GREATEST(sold - qty, 0)` to prevent negative sold counts.
 */
export async function releaseTickets(items: TicketItem[]): Promise<void> {
  for (const item of items) {
    await db
      .update(ticketTypes)
      .set({
        sold: sql`GREATEST(${ticketTypes.sold} - ${item.quantity}, 0)`,
      })
      .where(eq(ticketTypes.id, item.ticketTypeId));
  }
}
