export default async function NewVenuePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Create Venue</h1>
      <p className="mt-2 text-muted-foreground">
        Fill in the details to register a new venue.
      </p>

      {/* Venue form placeholder */}
      <section className="mt-8 rounded-xl border p-6">
        <div className="space-y-4">
          {[
            "Venue Name",
            "Address",
            "City",
            "State / Region",
            "Zip Code",
            "Capacity",
            "Description",
            "Website",
            "Phone",
            "Image",
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
      </section>
    </div>
  );
}
