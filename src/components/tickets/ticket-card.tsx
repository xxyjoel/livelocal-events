import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatPrice } from "@/lib/utils";
import type { getTicketsByUser } from "@/lib/db/queries/tickets";

type Ticket = Awaited<ReturnType<typeof getTicketsByUser>>[number];

const statusVariantMap: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  valid: "default",
  used: "secondary",
  cancelled: "destructive",
  refunded: "outline",
};

interface TicketCardProps {
  ticket: Ticket;
  isPast?: boolean;
}

export function TicketCard({ ticket, isPast = false }: TicketCardProps) {
  const { event, ticketType, order } = ticket;
  const statusVariant = statusVariantMap[ticket.status] ?? "default";

  return (
    <Link
      href={`/profile/tickets/${ticket.id}`}
      className={`flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50 ${
        isPast ? "opacity-60" : ""
      }`}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted/50">
        {event.thumbnailUrl || event.imageUrl ? (
          <Image
            src={(event.thumbnailUrl || event.imageUrl)!}
            alt={event.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No img
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1 overflow-hidden">
        <p className="truncate font-medium">{event.title}</p>
        <p className="text-sm text-muted-foreground">
          {formatEventDate(event.startDate)}
        </p>
        {event.venue && (
          <p className="truncate text-sm text-muted-foreground">
            {event.venue.name}
            {event.venue.city ? `, ${event.venue.city}` : ""}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={statusVariant} className="capitalize">
          {ticket.status}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {ticketType.name}
        </span>
      </div>
    </Link>
  );
}
