import Link from "next/link";
import { Button } from "@/components/ui/button";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { orders, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type OrderDetails = {
  orderId: string;
  eventName: string;
  quantity: number;
  totalAmount: number;
  serviceFee: number;
  currency: string;
};

async function getOrderDetails(
  sessionId: string
): Promise<OrderDetails | null> {
  try {
    // Retrieve the Stripe session to get the order ID
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = stripeSession.metadata?.orderId;

    if (!orderId) {
      return null;
    }

    // Look up the order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return null;
    }

    // Look up the event name
    const [event] = await db
      .select({ title: events.title })
      .from(events)
      .where(eq(events.id, order.eventId));

    return {
      orderId: order.id,
      eventName: event?.title || "Unknown Event",
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      serviceFee: order.serviceFee,
      currency: order.currency,
    };
  } catch (err) {
    console.error("Failed to retrieve order details:", err);
    return null;
  }
}

function formatCurrency(amountInCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const orderDetails = session_id ? await getOrderDetails(session_id) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg
          className="size-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="mt-6 text-4xl font-bold tracking-tight">
        Purchase Successful!
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Your tickets have been confirmed. Check your email for the confirmation
        details.
      </p>

      {/* Order Details */}
      <section className="mt-8 w-full rounded-xl border p-6 text-left">
        <h2 className="text-xl font-semibold">Order Details</h2>
        {orderDetails ? (
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-mono font-medium">
                {orderDetails.orderId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Event</span>
              <span className="font-medium">{orderDetails.eventName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tickets</span>
              <span className="font-medium">{orderDetails.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {formatCurrency(
                  orderDetails.totalAmount - orderDetails.serviceFee,
                  orderDetails.currency
                )}
              </span>
            </div>
            {orderDetails.serviceFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-medium">
                  {formatCurrency(
                    orderDetails.serviceFee,
                    orderDetails.currency
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Total Paid</span>
              <span className="font-bold">
                {formatCurrency(
                  orderDetails.totalAmount,
                  orderDetails.currency
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>
              Order details are being processed. Your tickets will be available
              shortly.
            </p>
          </div>
        )}
      </section>

      {/* Ticket Info */}
      <section className="mt-6 w-full rounded-xl border p-6 text-left">
        <h2 className="text-xl font-semibold">Your Tickets</h2>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>
            Your tickets with QR codes are available in your profile. Present
            your QR code at the venue for entry.
          </p>
        </div>
      </section>

      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href="/profile/tickets">View My Tickets</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
