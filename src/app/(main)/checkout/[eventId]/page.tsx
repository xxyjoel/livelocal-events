export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getEventById } from "@/lib/db/queries/events";
import { getTicketTypesByEvent } from "@/lib/db/queries/tickets";
import { formatEventDate } from "@/lib/utils";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon } from "lucide-react";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  // Auth check: redirect to sign-in if not logged in
  const session = await auth();
  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/checkout/${eventId}`);
  }

  // Fetch event and ticket types
  const [event, ticketTypes] = await Promise.all([
    getEventById(eventId),
    getTicketTypesByEvent(eventId),
  ]);

  if (!event) {
    notFound();
  }

  // Affiliate events use external checkout
  if (event.externalUrl) {
    redirect(event.externalUrl);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Event Summary */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="size-4" />
            <span>{formatEventDate(event.startDate)}</span>
          </div>
          {event.venue && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="size-4" />
              <span>{event.venue.name}</span>
            </div>
          )}
          {event.isFree && <Badge variant="secondary">Free Event</Badge>}
        </div>
      </div>

      {ticketTypes.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <p className="text-muted-foreground">
            No tickets are available for this event at this time.
          </p>
        </div>
      ) : (
        <CheckoutClient eventId={eventId} ticketTypes={ticketTypes} />
      )}
    </div>
  );
}
