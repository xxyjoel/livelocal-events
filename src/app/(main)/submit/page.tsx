export default async function SubmitPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight">Submit Your Event</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Are you a band or artist? Submit your event to be featured on LiveLocal.
      </p>

      {/* Submission Form Placeholder */}
      <section className="mt-8 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Event Details</h2>
        <div className="mt-6 space-y-4">
          {[
            "Event Name",
            "Date & Time",
            "Venue / Location",
            "Description",
            "Genre / Category",
            "Ticket Price",
            "Event Image",
            "Contact Email",
          ].map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium">{field}</label>
              <div className="h-10 w-full rounded-md border bg-muted/50" />
            </div>
          ))}
        </div>
        <div className="mt-8">
          <div className="h-10 w-full rounded-md bg-primary" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Submissions will be reviewed by our team before being published.
        </p>
      </section>
    </div>
  );
}
