import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { getTicketById } from "@/lib/db/queries/tickets";
import { QRCodeDisplay } from "@/components/tickets/qr-code";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusVariantMap: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  valid: "default",
  used: "secondary",
  cancelled: "destructive",
  refunded: "outline",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const ticket = await getTicketById(ticketId);
  if (!ticket || ticket.userId !== session.user.id) {
    notFound();
  }

  const { event, ticketType, order } = ticket;
  const statusVariant = statusVariantMap[ticket.status] ?? "default";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/profile/tickets"
        className="mb-6 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to My Tickets
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
      <p className="mt-1 text-muted-foreground">
        {formatEventDate(event.startDate)}
      </p>

      {/* QR Code */}
      <section className="mt-8 w-full rounded-xl border p-8 text-center">
        <QRCodeDisplay value={ticket.qrCode} size={256} />
        <p className="mt-4 text-sm text-muted-foreground">
          Present this QR code at the venue entrance
        </p>
        {ticket.status === "used" && ticket.checkedInAt && (
          <p className="mt-2 text-sm text-muted-foreground">
            Checked in at {format(ticket.checkedInAt, "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}
      </section>

      {/* Event Details */}
      <section className="mt-6 w-full rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Event Information</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date &amp; Time</span>
            <span>{formatEventDate(event.startDate)}</span>
          </div>
          {event.endDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ends</span>
              <span>{formatEventDate(event.endDate)}</span>
            </div>
          )}
          {event.venue && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Venue</span>
                <span>{event.venue.name}</span>
              </div>
              {event.venue.address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-right">
                    {event.venue.address}
                    {event.venue.city && `, ${event.venue.city}`}
                    {event.venue.state && `, ${event.venue.state}`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Ticket Details */}
      <section className="mt-6 w-full rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Ticket Details</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ticket Type</span>
            <span>{ticketType.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span>{formatPrice(ticketType.price)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={statusVariant} className="capitalize">
              {ticket.status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono text-xs">{order.id}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
