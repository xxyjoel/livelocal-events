export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
      <p className="mt-2 text-muted-foreground">
        Editing event:{" "}
        <span className="font-mono font-medium text-foreground">{eventId}</span>
      </p>

      {/* Event edit form placeholder */}
      <section className="mt-8 rounded-xl border p-6">
        <div className="space-y-4">
          {[
            "Event Name",
            "Slug",
            "Description",
            "Date & Time",
            "Venue",
            "Category",
            "Ticket Types & Pricing",
            "Cover Image",
            "Artists / Performers",
            "Status",
          ].map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium">{field}</label>
              <div className="h-10 w-full rounded-md border bg-muted/50" />
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-4">
          <div className="h-10 flex-1 rounded-md bg-primary" />
          <div className="h-10 w-32 rounded-md border" />
        </div>
      </section>
    </div>
  );
}
