import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SuccessPage() {
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

      {/* Order Details Placeholder */}
      <section className="mt-8 w-full rounded-xl border p-6 text-left">
        <h2 className="text-xl font-semibold">Order Details</h2>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>Order number placeholder</p>
          <p>Event name placeholder</p>
          <p>Date and time placeholder</p>
          <p>Number of tickets placeholder</p>
          <p>Total amount placeholder</p>
        </div>
      </section>

      {/* Ticket Links Placeholder */}
      <section className="mt-6 w-full rounded-xl border p-6 text-left">
        <h2 className="text-xl font-semibold">Your Tickets</h2>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>Ticket download links will appear here</p>
          <p>QR codes for entry will be generated</p>
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
