export default async function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight">
        Discover Events Near You
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Find live music, shows, and local experiences happening in your area.
      </p>

      {/* Featured Events */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Featured Events</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl border bg-muted/50 p-6 flex items-center justify-center text-muted-foreground"
            >
              Event Card Placeholder {i}
            </div>
          ))}
        </div>
      </section>

      {/* Category Pills */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Browse by Category</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Live Music", "Comedy", "Theater", "Art", "Food & Drink", "Outdoor"].map(
            (cat) => (
              <span
                key={cat}
                className="rounded-full border bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground"
              >
                {cat}
              </span>
            )
          )}
        </div>
      </section>

      {/* Event Grid */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Upcoming Events</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl border bg-muted/50 p-4 flex items-center justify-center text-muted-foreground"
            >
              Event {i}
            </div>
          ))}
        </div>
      </section>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        Coming soon: personalized event feed
      </p>
    </div>
  );
}
