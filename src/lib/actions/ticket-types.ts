"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { ticketTypes } from "@/lib/db/schema";
import { ticketTypeSchema } from "@/lib/validators/ticket-types";

export type TicketTypeActionState = {
  success: boolean;
  error?: string;
};

export async function createTicketTypeAction(
  eventId: string,
  _prevState: TicketTypeActionState,
  formData: FormData
): Promise<TicketTypeActionState> {
  const raw = Object.fromEntries(formData.entries());

  const parsed = ticketTypeSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validation failed",
    };
  }

  try {
    // Convert price from dollars to cents
    const priceInCents = Math.round(parsed.data.price * 100);

    await db.insert(ticketTypes).values({
      id: createId(),
      eventId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: priceInCents,
      quantity: parsed.data.quantity,
      maxPerOrder: parsed.data.maxPerOrder,
      salesStart: parsed.data.salesStart ?? null,
      salesEnd: parsed.data.salesEnd ?? null,
      sortOrder: parsed.data.sortOrder,
    });
  } catch (e) {
    return {
      success: false,
      error: "Failed to create ticket type. Please try again.",
    };
  }

  revalidatePath(`/admin/events/${eventId}/edit`);
  return { success: true };
}

export async function updateTicketTypeAction(
  ticketTypeId: string,
  _prevState: TicketTypeActionState,
  formData: FormData
): Promise<TicketTypeActionState> {
  const raw = Object.fromEntries(formData.entries());

  const parsed = ticketTypeSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validation failed",
    };
  }

  try {
    // Convert price from dollars to cents
    const priceInCents = Math.round(parsed.data.price * 100);

    const result = await db
      .update(ticketTypes)
      .set({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        price: priceInCents,
        quantity: parsed.data.quantity,
        maxPerOrder: parsed.data.maxPerOrder,
        salesStart: parsed.data.salesStart ?? null,
        salesEnd: parsed.data.salesEnd ?? null,
        sortOrder: parsed.data.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(ticketTypes.id, ticketTypeId))
      .returning();

    if (!result[0]) {
      return { success: false, error: "Ticket type not found." };
    }

    // Use the eventId from the result to revalidate the correct path
    revalidatePath(`/admin/events/${result[0].eventId}/edit`);
  } catch (e) {
    return {
      success: false,
      error: "Failed to update ticket type. Please try again.",
    };
  }

  return { success: true };
}

export async function deleteTicketTypeAction(
  ticketTypeId: string
): Promise<TicketTypeActionState> {
  try {
    // First check if any tickets have been sold
    const ticketType = await db.query.ticketTypes.findFirst({
      where: eq(ticketTypes.id, ticketTypeId),
    });

    if (!ticketType) {
      return { success: false, error: "Ticket type not found." };
    }

    if (ticketType.sold > 0) {
      return {
        success: false,
        error: "Cannot delete a ticket type that has sold tickets.",
      };
    }

    await db.delete(ticketTypes).where(eq(ticketTypes.id, ticketTypeId));

    revalidatePath(`/admin/events/${ticketType.eventId}/edit`);
  } catch (e) {
    return { success: false, error: "Failed to delete ticket type." };
  }

  return { success: true };
}
