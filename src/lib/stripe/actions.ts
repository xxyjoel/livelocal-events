"use server";

import { stripe } from "./index";

export async function createCheckoutSession(params: {
  eventId: string;
  items: Array<{
    ticketTypeId: string;
    quantity: number;
    name: string;
    price: number;
  }>;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  // TODO: Implement in Phase 5
  // 1. Create order record in the database
  // 2. Create Stripe checkout session with line items
  // 3. Return session URL for redirect
  throw new Error("Not implemented yet - Phase 5");
}
