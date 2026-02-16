"use server";

import { stripe } from "./index";
import { db } from "@/lib/db";
import { orders, ticketTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { auth } from "@/lib/auth";
import { reserveTickets, releaseTickets } from "./helpers";
import type Stripe from "stripe";

export async function createCheckoutSession(params: {
  eventId: string;
  items: Array<{
    ticketTypeId: string;
    quantity: number;
    name: string;
    price: number; // in cents
  }>;
}): Promise<{ url: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const { eventId, items } = params;
  const userId = session.user.id;

  // Validate that we have at least one item
  if (!items || items.length === 0) {
    return { error: "No items selected" };
  }

  // Validate quantities are positive integers
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { error: "Invalid quantity" };
    }
    if (!Number.isInteger(item.price) || item.price < 0) {
      return { error: "Invalid price" };
    }
  }

  // 1. Atomically reserve tickets (validates availability, sales windows, max per order)
  const reserveResult = await reserveTickets(
    items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }))
  );

  if (!reserveResult.success) {
    return { error: reserveResult.reason };
  }

  // 2. Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
  const totalAmount = subtotal + serviceFee;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // 3. Create order record with status "pending"
  const orderId = createId();

  try {
    await db.insert(orders).values({
      id: orderId,
      userId,
      eventId,
      status: "pending",
      totalAmount,
      serviceFee,
      currency: "usd",
      quantity: totalQuantity,
    });
  } catch (err) {
    // If order creation fails, release the reserved tickets
    await releaseTickets(
      items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }))
    );
    console.error("Failed to create order:", err);
    return { error: "Failed to create order" };
  }

  // 4. Create Stripe Checkout session
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";

  // Build line items for Stripe
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    })
  );

  // Add service fee as a separate line item
  if (serviceFee > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Service Fee",
        },
        unit_amount: serviceFee,
      },
      quantity: 1,
    });
  }

  // Serialize items for metadata (Stripe metadata values must be strings, max 500 chars)
  const itemsMeta = JSON.stringify(
    items.map((i) => ({
      t: i.ticketTypeId,
      q: i.quantity,
    }))
  );

  let stripeSession: Stripe.Checkout.Session;
  try {
    stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        orderId,
        eventId,
        userId,
        items: itemsMeta,
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/${eventId}`,
      customer_email: session.user.email || undefined,
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
    });
  } catch (err) {
    // If Stripe session creation fails, release tickets and mark order as failed
    await releaseTickets(
      items.map((i) => ({ ticketTypeId: i.ticketTypeId, quantity: i.quantity }))
    );
    await db
      .update(orders)
      .set({ status: "failed" })
      .where(eq(orders.id, orderId));
    console.error("Failed to create Stripe checkout session:", err);
    return { error: "Failed to create checkout session" };
  }

  // 5. Save stripeSessionId on the order
  await db
    .update(orders)
    .set({ stripeSessionId: stripeSession.id })
    .where(eq(orders.id, orderId));

  // 6. Return URL for redirect
  if (!stripeSession.url) {
    return { error: "Stripe session URL not available" };
  }

  return { url: stripeSession.url };
}
