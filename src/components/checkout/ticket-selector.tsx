"use client";

import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MinusIcon, PlusIcon } from "lucide-react";

export interface TicketTypeForCheckout {
  id: string;
  name: string;
  description: string | null;
  price: number; // in cents
  quantity: number;
  sold: number;
  maxPerOrder: number;
  salesStart: Date | null;
  salesEnd: Date | null;
}

export interface TicketSelection {
  ticketTypeId: string;
  name: string;
  price: number; // in cents
  quantity: number;
}

interface TicketSelectorProps {
  ticketTypes: TicketTypeForCheckout[];
  selections: Record<string, number>;
  onSelectionChange: (selections: Record<string, number>) => void;
}

function isOnSale(ticketType: TicketTypeForCheckout): boolean {
  const now = new Date();
  if (ticketType.salesStart && now < ticketType.salesStart) return false;
  if (ticketType.salesEnd && now > ticketType.salesEnd) return false;
  return true;
}

export function TicketSelector({
  ticketTypes,
  selections,
  onSelectionChange,
}: TicketSelectorProps) {
  function handleQuantityChange(ticketTypeId: string, delta: number) {
    const current = selections[ticketTypeId] ?? 0;
    const newQty = Math.max(0, current + delta);

    const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);
    if (!ticketType) return;

    const available = ticketType.quantity - ticketType.sold;
    const clamped = Math.min(newQty, ticketType.maxPerOrder, available);

    const updated = { ...selections };
    if (clamped === 0) {
      delete updated[ticketTypeId];
    } else {
      updated[ticketTypeId] = clamped;
    }
    onSelectionChange(updated);
  }

  return (
    <div className="space-y-3">
      {ticketTypes.map((ticketType) => {
        const available = ticketType.quantity - ticketType.sold;
        const isSoldOut = available <= 0;
        const onSale = isOnSale(ticketType);
        const isDisabled = isSoldOut || !onSale;
        const currentQty = selections[ticketType.id] ?? 0;

        return (
          <div
            key={ticketType.id}
            className={`flex items-center justify-between rounded-lg border p-4 ${
              isDisabled ? "opacity-60" : ""
            }`}
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{ticketType.name}</span>
                {isSoldOut && (
                  <Badge variant="destructive">Sold Out</Badge>
                )}
                {!onSale && !isSoldOut && (
                  <Badge variant="secondary">Not on Sale</Badge>
                )}
              </div>
              {ticketType.description && (
                <p className="text-sm text-muted-foreground">
                  {ticketType.description}
                </p>
              )}
              <p className="text-sm font-medium">
                {ticketType.price === 0
                  ? "Free"
                  : formatPrice(ticketType.price)}
              </p>
              {!isSoldOut && onSale && (
                <p className="text-xs text-muted-foreground">
                  {available} remaining &middot; Max {ticketType.maxPerOrder}{" "}
                  per order
                </p>
              )}
            </div>

            {!isDisabled && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11"
                  onClick={() => handleQuantityChange(ticketType.id, -1)}
                  disabled={currentQty === 0}
                >
                  <MinusIcon className="size-4" />
                </Button>
                <span className="w-8 text-center font-medium tabular-nums">
                  {currentQty}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11"
                  onClick={() => handleQuantityChange(ticketType.id, 1)}
                  disabled={
                    currentQty >= ticketType.maxPerOrder ||
                    currentQty >= available
                  }
                >
                  <PlusIcon className="size-4" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
