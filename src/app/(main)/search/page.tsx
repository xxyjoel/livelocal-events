export default async function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight">Search Events</h1>
      <p className="mt-2 text-muted-foreground">
        Find events by name, location, date, or category.
      </p>

      {/* Filters placeholder */}
      <section className="mt-8">
        <div className="flex flex-wrap gap-4 rounded-xl border bg-muted/50 p-6">
          <div className="h-10 w-64 rounded-md border bg-background" />
          <div className="h-10 w-40 rounded-md border bg-background" />
          <div className="h-10 w-40 rounded-md border bg-background" />
          <div className="h-10 w-32 rounded-md border bg-background" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Placeholder for search filters: keyword, location, date range, category
        </p>
      </section>

      {/* Results grid placeholder */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Results</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl border bg-muted/50 p-4 flex items-center justify-center text-muted-foreground"
            >
              Search Result {i}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
