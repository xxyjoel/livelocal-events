import { Suspense } from "react";
import { EventCard } from "@/components/events/event-card";
import { EventCardSkeleton } from "@/components/events/event-card-skeleton";
import { FeaturedCarousel } from "@/components/events/featured-carousel";
import { CategoryFilterSection } from "@/components/events/category-filter-section";
import { LocationBar } from "@/components/events/location-bar";
import { Button } from "@/components/ui/button";
import {
  getFeaturedEvents,
  getWeekendEvents as getWeekendEventsQuery,
  getUpcomingEvents as getUpcomingEventsQuery,
  getEventsByCategory,
} from "@/lib/db/queries/events";
import { toEventCard } from "@/lib/db/mappers";

// ---------------------------------------------------------------------------
// Sub-components with Suspense data fetching
// ---------------------------------------------------------------------------
async function FeaturedEventsSection() {
  const dbEvents = await getFeaturedEvents(3);

  if (dbEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12">
        <p className="text-muted-foreground">No featured events yet. Check back soon!</p>
      </div>
    );
  }

  return <FeaturedCarousel events={dbEvents.map(toEventCard)} />;
}

async function WeekendEventsSection() {
  const dbEvents = await getWeekendEventsQuery(4);

  if (dbEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12">
        <p className="text-muted-foreground">No events this weekend.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {dbEvents.map(toEventCard).map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

async function UpcomingEventsSection({ category }: { category?: string | null }) {
  const dbEvents = category
    ? await getEventsByCategory(category, 8)
    : await getUpcomingEventsQuery(8);

  if (dbEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12">
        <p className="text-muted-foreground">
          {category ? "No events in this category." : "No upcoming events found."}
        </p>
        {category && (
          <p className="mt-1 text-sm text-muted-foreground">
            Try selecting a different category or check back later.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {dbEvents.map(toEventCard).map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton fallbacks
// ---------------------------------------------------------------------------
function FeaturedSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="shrink-0 w-full sm:w-[calc(100%-2rem)] md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]"
        >
          <div className="aspect-[16/7] sm:aspect-[16/8] animate-pulse rounded-xl bg-accent" />
        </div>
      ))}
    </div>
  );
}

function EventGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categoryParam = typeof params.category === "string" ? params.category : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Discover Events Near You
        </h1>
        <div className="mt-3">
          <LocationBar defaultLocation="Seattle, WA" />
        </div>
      </section>

      {/* Featured Events */}
      <section className="mt-10" aria-labelledby="featured-heading">
        <h2 id="featured-heading" className="text-2xl font-semibold">
          Featured Events
        </h2>
        <div className="mt-4">
          <Suspense fallback={<FeaturedSkeleton />}>
            <FeaturedEventsSection />
          </Suspense>
        </div>
      </section>

      {/* Category Filter */}
      <section className="mt-10" aria-labelledby="category-heading">
        <h2 id="category-heading" className="text-2xl font-semibold">
          Browse by Category
        </h2>
        <div className="mt-4">
          <Suspense>
            <CategoryFilterSection />
          </Suspense>
        </div>
      </section>

      {/* This Weekend */}
      <section className="mt-10" aria-labelledby="weekend-heading">
        <h2 id="weekend-heading" className="text-2xl font-semibold">
          This Weekend
        </h2>
        <div className="mt-4">
          <Suspense fallback={<EventGridSkeleton count={4} />}>
            <WeekendEventsSection />
          </Suspense>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="mt-10" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="text-2xl font-semibold">
          Upcoming Events
        </h2>
        <div className="mt-4">
          <Suspense fallback={<EventGridSkeleton count={8} />}>
            <UpcomingEventsSection category={categoryParam} />
          </Suspense>
        </div>
      </section>

      {/* Load More */}
      <div className="mt-10 flex justify-center">
        <Button variant="outline" size="lg" disabled>
          Load More Events
        </Button>
      </div>
    </div>
  );
}
