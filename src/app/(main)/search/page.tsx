import { type Metadata } from "next";
import Link from "next/link";
import { createSearchParamsCache, parseAsString, parseAsInteger } from "nuqs/server";

import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/event-card";
import { SearchInput } from "@/components/events/search-input";
import { EventFilters } from "@/components/events/event-filters";
import { searchEventsForDiscovery } from "@/lib/db/queries/events";
import { searchResultToEventCard } from "@/lib/db/mappers";
import { SITE_NAME } from "@/lib/constants";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

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

const PAGE_SIZE = 12;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParamsCache.parse(await searchParams);

  const page = params.page;
  const offset = (page - 1) * PAGE_SIZE;

  const { events: dbEvents, total } = await searchEventsForDiscovery({
    q: params.q || undefined,
    categorySlug: params.category ?? undefined,
    date: params.date ?? undefined,
    minPrice: params.minPrice ?? undefined,
    maxPrice: params.maxPrice ?? undefined,
    sort: params.sort,
    limit: PAGE_SIZE,
    offset,
  });

  const events = dbEvents.map(searchResultToEventCard);

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

        {/* Pagination */}
        {total > PAGE_SIZE && (() => {
          const totalPages = Math.ceil(total / PAGE_SIZE);
          // Build pagination URL preserving all current search params
          function pageUrl(p: number) {
            const sp = new URLSearchParams();
            if (params.q) sp.set("q", params.q);
            if (params.category) sp.set("category", params.category);
            if (params.date) sp.set("date", params.date);
            if (params.distance !== 25) sp.set("distance", String(params.distance));
            if (params.minPrice) sp.set("minPrice", String(params.minPrice));
            if (params.maxPrice) sp.set("maxPrice", String(params.maxPrice));
            if (params.sort !== "date") sp.set("sort", params.sort);
            if (p > 1) sp.set("page", String(p));
            const qs = sp.toString();
            return `/search${qs ? `?${qs}` : ""}`;
          }
          return (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link
                    href={pageUrl(page - 1)}
                    aria-disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  >
                    <ChevronLeftIcon className="size-4" />
                    Previous
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link
                    href={pageUrl(page + 1)}
                    aria-disabled={page >= totalPages}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                  >
                    Next
                    <ChevronRightIcon className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })()}
      </section>
    </div>
  );
}
