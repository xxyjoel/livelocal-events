"use client";

import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2Icon, ShoppingCartIcon } from "lucide-react";
import type { TicketSelection } from "./ticket-selector";

interface OrderSummaryProps {
  items: TicketSelection[];
  isPending: boolean;
}

const SERVICE_FEE_RATE = 0.05; // 5%

export function OrderSummary({ items, isPending }: OrderSummaryProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // No service fee for free events
  const serviceFee =
    subtotal > 0 ? Math.round(subtotal * SERVICE_FEE_RATE) : 0;
  const total = subtotal + serviceFee;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Select tickets to see your order summary.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.ticketTypeId}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {item.name} &times; {item.quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Service Fee (5%)
              </span>
              <span>{formatPrice(serviceFee)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </>
      )}

      {/* Desktop: inline button, Mobile: sticky bottom bar */}
      <div className="hidden lg:block">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={totalQuantity === 0 || isPending}
        >
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <ShoppingCartIcon className="size-4" />
          )}
          {totalQuantity === 0
            ? "Select Tickets"
            : `Proceed to Payment — ${formatPrice(total)}`}
        </Button>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 lg:hidden">
        <Button
          type="submit"
          className="w-full min-h-12"
          size="lg"
          disabled={totalQuantity === 0 || isPending}
        >
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <ShoppingCartIcon className="size-4" />
          )}
          {totalQuantity === 0
            ? "Select Tickets"
            : `Proceed to Payment — ${formatPrice(total)}`}
        </Button>
      </div>
      {/* Spacer to prevent content from being hidden behind the sticky button on mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
