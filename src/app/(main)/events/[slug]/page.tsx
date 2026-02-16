export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight">Event Detail</h1>
      <p className="mt-2 text-muted-foreground">
        Viewing event: <span className="font-mono font-medium text-foreground">{slug}</span>
      </p>

      {/* Hero Image */}
      <section className="mt-8">
        <div className="h-64 w-full rounded-xl border bg-muted/50 flex items-center justify-center text-muted-foreground sm:h-96">
          Hero Image Placeholder
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Event Info */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border p-6">
            <h2 className="text-2xl font-semibold">Event Information</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p>Date and time placeholder</p>
              <p>Venue and location placeholder</p>
              <p>Description placeholder</p>
              <p>Artist/performer lineup placeholder</p>
            </div>
          </section>

          {/* Similar Events */}
          <section>
            <h2 className="text-xl font-semibold">Similar Events</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl border bg-muted/50 p-4 flex items-center justify-center text-muted-foreground"
                >
                  Similar Event {i}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Ticket Section */}
        <div className="lg:col-span-1">
          <section className="sticky top-24 rounded-xl border p-6">
            <h2 className="text-xl font-semibold">Tickets</h2>
            <div className="mt-4 space-y-3 text-muted-foreground">
              <p>Ticket type selection placeholder</p>
              <p>Quantity selector placeholder</p>
              <p>Price display placeholder</p>
            </div>
            <div className="mt-6 h-10 w-full rounded-md bg-primary" />
          </section>
        </div>
      </div>
    </div>
  );
}
