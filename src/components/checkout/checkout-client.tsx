"use client";

import { useState, useTransition } from "react";
import {
  TicketSelector,
  type TicketTypeForCheckout,
  type TicketSelection,
} from "./ticket-selector";
import { OrderSummary } from "./order-summary";
import { createCheckoutSession } from "@/lib/stripe/actions";

interface CheckoutClientProps {
  eventId: string;
  ticketTypes: TicketTypeForCheckout[];
}

export function CheckoutClient({ eventId, ticketTypes }: CheckoutClientProps) {
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Build the line items from selections
  const items: TicketSelection[] = Object.entries(selections)
    .filter(([, qty]) => qty > 0)
    .map(([ticketTypeId, quantity]) => {
      const ticketType = ticketTypes.find((t) => t.id === ticketTypeId)!;
      return {
        ticketTypeId,
        name: ticketType.name,
        price: ticketType.price,
        quantity,
      };
    });

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createCheckoutSession({
          eventId,
          items: items.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            name: item.name,
            price: item.price,
          })),
        });

        if ("error" in result) {
          setError(result.error);
          return;
        }

        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Something went wrong. Please try again."
        );
      }
    });
  }

  return (
    <form action={handleSubmit}>
      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Ticket Selection */}
        <section className="rounded-xl border p-6">
          <h2 className="mb-4 text-xl font-semibold">Select Tickets</h2>
          <TicketSelector
            ticketTypes={ticketTypes}
            selections={selections}
            onSelectionChange={setSelections}
          />
        </section>

        {/* Order Summary */}
        <section className="rounded-xl border p-6">
          <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
          <OrderSummary items={items} isPending={isPending} />
        </section>
      </div>
    </form>
  );
}
