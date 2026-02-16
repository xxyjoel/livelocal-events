import { Suspense } from "react";
import { addDays, setHours, setMinutes } from "date-fns";
import { EventCard, type EventCardEvent } from "@/components/events/event-card";
import { EventCardSkeleton } from "@/components/events/event-card-skeleton";
import { FeaturedCarousel } from "@/components/events/featured-carousel";
import { CategoryFilterSection } from "@/components/events/category-filter-section";
import { LocationBar } from "@/components/events/location-bar";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Mock data generator
// ---------------------------------------------------------------------------
function getMockEvents(): EventCardEvent[] {
  const now = new Date();

  // Helper to create a date N days from now at a specific hour
  function futureDate(daysFromNow: number, hour: number, minute = 0): Date {
    return setMinutes(setHours(addDays(now, daysFromNow), hour), minute);
  }

  return [
    {
      id: "evt_1",
      title: "The War on Drugs - Live at Brooklyn Steel",
      slug: "the-war-on-drugs-brooklyn-steel",
      startDate: futureDate(1, 20),
      imageUrl: null,
      thumbnailUrl: null,
      minPrice: 4500,
      maxPrice: 8500,
      isFree: false,
      venue: { name: "Brooklyn Steel", city: "Brooklyn", state: "NY" },
      category: { name: "Concert", icon: "\uD83C\uDFB5", slug: "concerts" },
      externalSource: "ticketmaster",
      distance_km: 3.2,
    },
    {
      id: "evt_2",
      title: "Saturday Night Comedy Showcase",
      slug: "saturday-night-comedy-showcase",
      startDate: futureDate(2, 21, 30),
      imageUrl: null,
      thumbnailUrl: null,
      minPrice: 2000,
      maxPrice: 2000,
      isFree: false,
      venue: { name: "Comedy Cellar", city: "New York", state: "NY" },
      category: { name: "Comedy", icon: "\uD83D\uDE02", slug: "comedy" },
      externalSource: null,
      distance_km: 1.5,
    },
    {
      id: "evt_3",
      title: "Free Jazz in Central Park - Summer Sessions",
      slug: "free-jazz-central-park-summer",
      startDate: futureDate(3, 14),
      imageUrl: null,
      thumbnailUrl: null,
      minPrice: null,
      maxPrice: null,
      isFree: true,
      venue: { name: "Central Park SummerStage", city: "New York", state: "NY" },
      category: { name: "Concert", icon: "\uD83C\uDFB5", slug: "concerts" },
      externalSource: null,
      distance_km: 2.8,
    },
    {
      id: "evt_4",
      title: "Hamilton - Broadway",
      slug: "hamilton-broadway",
      startDate: futureDate(4, 19),
      imageUrl: null,
      thumbnailUrl: null,
      minPrice: 12900,
      maxPrice: 49900,
      isFree: false,
      venue: { name: "Richard Rodgers Theatre", city: "New York", state: "NY" },
      category: { name: "Theater", icon: "\uD83C\uDFAD", slug: "theater" },
      externalSource: "seatgeek",
      distance_km: 1.1,
    },
    {
      id: "evt_5",
      title: "Governors Ball After Party ft. LCD Soundsystem",
      slug: "govball-after-party-lcd-soundsystem",
      startDate: futureDate(5, 22),
      imageUrl: null,
      thumbnailUrl: null,
      minPrice: 6500,
      maxPrice: 12000,
      isFree: false,
      venue: { name: "Webster Hall", city: "New York", state: "NY" },
      category: { name: "Nightlife", icon: "\uD83C\uDF19", slug: "nightlife" },
      externalSource: "ticketmaster",
      distance_km: 1.9,
    },
    {
      id: "evt_6",
      title: "Brooklyn Flea Market + Live Music",
      slug: "brooklyn-flea-market-live-music",
      startDate: futureDate(1, 10),
      imageUrl: null,
      thumbnailUrl: null,
      minPrice: null,
      maxPrice: null,
      isFree: true,
      venue: { name: "Brooklyn Flea", city: "Brooklyn", state: "NY" },
      category: { name: "Community", icon: "\uD83E\uDD1D", slug: "community" },
      externalSource: null,
      distance_km: 4.5,
    },
    {
      id: "evt_7",
      title: "Knicks vs. Celtics - Madison Square Garden",
      slug: "knicks-vs-celtics-msg",
      startDate: futureDate(6, 19, 30),
      imageUrl: null,
      thumbnailUrl: null,
      minPrice: 7500,
      maxPrice: 35000,
      isFree: false,
      venue: { name: "Madison Square Garden", city: "New York", state: "NY" },
      category: { name: "Sports", icon: "\u26BD", slug: "sports" },
      externalSource: "seatgeek",
      distance_km: 0.8,
    },
    {
      id: "evt_8",
      title: "Immersive Van Gogh Experience",
      slug: "immersive-van-gogh-experience",
      startDate: futureDate(7, 11),
      imageUrl: null,
      thumbnailUrl: null,
      minPrice: 3900,
      maxPrice: 5900,
      isFree: false,
      venue: { name: "Pier 36", city: "New York", state: "NY" },
      category: { name: "Arts", icon: "\uD83C\uDFA8", slug: "arts" },
      externalSource: null,
      distance_km: 2.3,
    },
  ];
}

// ---------------------------------------------------------------------------
// Data "fetchers" (mock, simulating async)
// ---------------------------------------------------------------------------
async function getFeaturedEvents(): Promise<EventCardEvent[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  const events = getMockEvents();
  return events.slice(0, 3);
}

async function getWeekendEvents(): Promise<EventCardEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const events = getMockEvents();
  return events.slice(0, 4);
}

async function getUpcomingEvents(category?: string | null): Promise<EventCardEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const events = getMockEvents();
  if (category) {
    return events.filter((e) => e.category.slug === category);
  }
  return events;
}

// ---------------------------------------------------------------------------
// Sub-components with Suspense data fetching
// ---------------------------------------------------------------------------
async function FeaturedEventsSection() {
  const events = await getFeaturedEvents();
  return <FeaturedCarousel events={events} />;
}

async function WeekendEventsSection() {
  const events = await getWeekendEvents();
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

async function UpcomingEventsSection({ category }: { category?: string | null }) {
  const events = await getUpcomingEvents(category);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12">
        <p className="text-muted-foreground">No events found in this category.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try selecting a different category or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {events.map((event) => (
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
          <LocationBar defaultLocation="New York, NY" />
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
