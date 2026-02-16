import { type Metadata } from "next";
import { createSearchParamsCache, parseAsString, parseAsInteger } from "nuqs/server";

import { EventCard } from "@/components/events/event-card";
import { SearchInput } from "@/components/events/search-input";
import { EventFilters } from "@/components/events/event-filters";
import { getMockSearchResults, type SearchFilters } from "@/lib/mock-data";
import { SITE_NAME } from "@/lib/constants";

// ---- SEO Metadata ----

export const metadata: Metadata = {
  title: `Search Events | ${SITE_NAME}`,
  description:
    "Find events by name, location, date, or category. Discover live music, comedy, theater, festivals, and more happening near you.",
};

// ---- nuqs search params cache ----

const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  category: parseAsString,
  date: parseAsString,
  distance: parseAsInteger.withDefault(25),
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
  sort: parseAsString.withDefault("date"),
  page: parseAsInteger.withDefault(1),
});

// ---- Page Component ----

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParamsCache.parse(await searchParams);

  const filters: SearchFilters = {
    q: params.q || undefined,
    category: params.category ?? undefined,
    date: params.date ?? undefined,
    distance: params.distance,
    minPrice: params.minPrice ?? undefined,
    maxPrice: params.maxPrice ?? undefined,
    sort: params.sort,
    page: params.page,
  };

  const { events, total, page, pageSize } = getMockSearchResults(filters);

  const hasFilters =
    params.q ||
    params.category ||
    params.date ||
    params.distance !== 25 ||
    params.minPrice ||
    params.maxPrice ||
    params.sort !== "date";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Search Events
        </h1>
        <p className="text-muted-foreground">
          Find events by name, location, date, or category.
        </p>
      </div>

      {/* Search Input */}
      <section className="mt-6">
        <SearchInput />
      </section>

      {/* Filters */}
      <section className="mt-6 rounded-xl border bg-card p-4 sm:p-6">
        <EventFilters />
      </section>

      {/* Results */}
      <section className="mt-8">
        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "No events found"
              : total === 1
                ? "Showing 1 event"
                : `Showing ${events.length} of ${total} events`}
            {params.q && (
              <span>
                {" "}
                for &ldquo;
                <span className="font-medium text-foreground">{params.q}</span>
                &rdquo;
              </span>
            )}
          </p>
        </div>

        {/* Empty State */}
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <div className="text-4xl mb-4">
              {hasFilters ? "🔍" : "🎶"}
            </div>
            <h3 className="text-lg font-semibold">No events found</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {hasFilters
                ? "Try adjusting your filters or search query to find more events."
                : "There are no upcoming events at the moment. Check back soon!"}
            </p>
          </div>
        ) : (
          /* Event Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Pagination placeholder */}
        {total > pageSize && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(total / pageSize)}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
