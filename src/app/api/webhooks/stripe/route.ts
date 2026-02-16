import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orders, tickets, ticketTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { releaseTickets } from "@/lib/stripe/helpers";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        // Unhandled event type — acknowledge receipt
        break;
    }
  } catch (err) {
    // Log the error but return 200 to Stripe to prevent retries on application errors
    console.error(`Error handling webhook event ${event.type}:`, err);
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle successful checkout completion.
 * 1. Find order by stripeSessionId
 * 2. Idempotency check: skip if already completed
 * 3. Update order status to "completed"
 * 4. Create individual ticket records
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const stripeSessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  // Find the order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, stripeSessionId));

  if (!order) {
    console.error(
      `Webhook: No order found for session ${stripeSessionId}`
    );
    return;
  }

  // Idempotency: if already completed, do nothing
  if (order.status === "completed") {
    return;
  }

  // Update order to completed
  await db
    .update(orders)
    .set({
      status: "completed",
      stripePaymentIntentId: paymentIntentId,
    })
    .where(eq(orders.id, order.id));

  // Parse items from session metadata
  const metadata = session.metadata;
  if (!metadata?.items) {
    console.error(
      `Webhook: No items metadata on session ${stripeSessionId}`
    );
    return;
  }

  let items: Array<{ t: string; q: number }>;
  try {
    items = JSON.parse(metadata.items);
  } catch {
    console.error(
      `Webhook: Failed to parse items metadata for session ${stripeSessionId}`
    );
    return;
  }

  const eventId = metadata.eventId || order.eventId;
  const userId = metadata.userId || order.userId;

  // Create individual ticket records
  const ticketRecords: Array<{
    id: string;
    orderId: string;
    ticketTypeId: string;
    eventId: string;
    userId: string;
    status: "valid";
    qrCode: string;
  }> = [];

  for (const item of items) {
    for (let i = 0; i < item.q; i++) {
      ticketRecords.push({
        id: createId(),
        orderId: order.id,
        ticketTypeId: item.t,
        eventId,
        userId,
        status: "valid",
        qrCode: crypto.randomUUID(),
      });
    }
  }

  if (ticketRecords.length > 0) {
    await db.insert(tickets).values(ticketRecords);
  }
}

/**
 * Handle expired checkout session.
 * 1. Find order by stripeSessionId
 * 2. If pending, set to failed
 * 3. Release reserved tickets
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const stripeSessionId = session.id;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, stripeSessionId));

  if (!order) {
    console.error(
      `Webhook: No order found for expired session ${stripeSessionId}`
    );
    return;
  }

  // Only transition from pending to failed
  if (order.status !== "pending") {
    return;
  }

  await db
    .update(orders)
    .set({ status: "failed" })
    .where(eq(orders.id, order.id));

  // Release reserved tickets
  const metadata = session.metadata;
  if (metadata?.items) {
    try {
      const items: Array<{ t: string; q: number }> = JSON.parse(
        metadata.items
      );
      await releaseTickets(
        items.map((i) => ({ ticketTypeId: i.t, quantity: i.q }))
      );
    } catch {
      console.error(
        `Webhook: Failed to parse items for ticket release on session ${stripeSessionId}`
      );
    }
  }
}

/**
 * Handle charge refund.
 * 1. Find order by stripePaymentIntentId
 * 2. Set order status to "refunded"
 * 3. Update all tickets for this order to "refunded"
 * 4. Release reserved tickets
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id || null;

  if (!paymentIntentId) {
    console.error("Webhook: No payment_intent on refunded charge");
    return;
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntentId));

  if (!order) {
    console.error(
      `Webhook: No order found for payment intent ${paymentIntentId}`
    );
    return;
  }

  // Update order status to refunded
  await db
    .update(orders)
    .set({ status: "refunded" })
    .where(eq(orders.id, order.id));

  // Update all tickets for this order to refunded
  await db
    .update(tickets)
    .set({ status: "refunded" })
    .where(eq(tickets.orderId, order.id));

  // Get the ticket breakdown to release inventory
  const orderTickets = await db
    .select({
      ticketTypeId: tickets.ticketTypeId,
    })
    .from(tickets)
    .where(eq(tickets.orderId, order.id));

  // Group tickets by type and count
  const ticketCounts = new Map<string, number>();
  for (const ticket of orderTickets) {
    ticketCounts.set(
      ticket.ticketTypeId,
      (ticketCounts.get(ticket.ticketTypeId) || 0) + 1
    );
  }

  // Release the reserved ticket counts
  const releaseItems = Array.from(ticketCounts.entries()).map(
    ([ticketTypeId, quantity]) => ({
      ticketTypeId,
      quantity,
    })
  );

  if (releaseItems.length > 0) {
    await releaseTickets(releaseItems);
  }
}
