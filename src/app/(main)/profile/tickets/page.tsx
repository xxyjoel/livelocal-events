export default async function MyTicketsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight">My Tickets</h1>
      <p className="mt-2 text-muted-foreground">
        View and manage your event tickets.
      </p>

      {/* Upcoming Tickets */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Upcoming</h2>
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border p-4"
            >
              <div className="size-16 shrink-0 rounded-lg bg-muted/50" />
              <div className="flex-1 space-y-1">
                <p className="font-medium">Event Name Placeholder {i}</p>
                <p className="text-sm text-muted-foreground">
                  Date and venue placeholder
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Ticket #{i}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Tickets */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Past Events</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4 rounded-xl border p-4 opacity-60">
            <div className="size-16 shrink-0 rounded-lg bg-muted/50" />
            <div className="flex-1 space-y-1">
              <p className="font-medium">Past Event Placeholder</p>
              <p className="text-sm text-muted-foreground">
                Date and venue placeholder
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
