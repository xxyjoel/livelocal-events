import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTicketsByUser } from "@/lib/db/queries/tickets";
import { TicketCard } from "@/components/tickets/ticket-card";

export const dynamic = "force-dynamic";

export default async function MyTicketsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const tickets = await getTicketsByUser(session.user.id);

  const now = new Date();
  const upcoming = tickets.filter(
    (t) => t.event.startDate >= now
  );
  const past = tickets.filter(
    (t) => t.event.startDate < now
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight">My Tickets</h1>
      <p className="mt-2 text-muted-foreground">
        View and manage your event tickets.
      </p>

      {tickets.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground">No tickets yet.</p>
          <p className="mt-2 text-muted-foreground">
            Browse upcoming events and grab your first ticket.
          </p>
          <Link
            href="/events"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <>
          {/* Upcoming Tickets */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length > 0 ? (
              <div className="mt-4 space-y-4">
                {upcoming.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No upcoming tickets.
              </p>
            )}
          </section>

          {/* Past Tickets */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">
              Past Events ({past.length})
            </h2>
            {past.length > 0 ? (
              <div className="mt-4 space-y-4">
                {past.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} isPast />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No past tickets.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
