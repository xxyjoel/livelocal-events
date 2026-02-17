import type { EventCardEvent } from "@/components/events/event-card";
import type {
  getFeaturedEvents,
  getUpcomingEvents,
  getEventBySlug,
  searchEvents,
} from "@/lib/db/queries/events";

// ---------------------------------------------------------------------------
// Type aliases for DB query results
// ---------------------------------------------------------------------------

type RelationalEvent = Awaited<ReturnType<typeof getFeaturedEvents>>[number];
type SearchRow = Awaited<ReturnType<typeof searchEvents>>[number];
type EventDetailResult = NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>;

// ---------------------------------------------------------------------------
// toEventCard — relational query results → EventCardEvent
// ---------------------------------------------------------------------------

export function toEventCard(dbEvent: RelationalEvent): EventCardEvent {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    slug: dbEvent.slug,
    startDate: dbEvent.startDate,
    imageUrl: dbEvent.imageUrl,
    thumbnailUrl: dbEvent.thumbnailUrl,
    minPrice: dbEvent.minPrice,
    maxPrice: dbEvent.maxPrice,
    isFree: dbEvent.isFree,
    venue: {
      name: dbEvent.venue.name,
      city: dbEvent.venue.city ?? null,
      state: dbEvent.venue.state ?? null,
    },
    category: {
      name: dbEvent.category.name,
      icon: dbEvent.category.icon,
      slug: dbEvent.category.slug,
    },
    externalSource: dbEvent.externalSource,
    distance_km: null,
  };
}

// ---------------------------------------------------------------------------
// searchResultToEventCard — flat join-based results → EventCardEvent
// ---------------------------------------------------------------------------

export function searchResultToEventCard(row: SearchRow): EventCardEvent {
  return {
    id: row.event.id,
    title: row.event.title,
    slug: row.event.slug,
    startDate: row.event.startDate,
    imageUrl: row.event.imageUrl,
    thumbnailUrl: row.event.thumbnailUrl,
    minPrice: row.event.minPrice,
    maxPrice: row.event.maxPrice,
    isFree: row.event.isFree,
    venue: {
      name: row.venueName ?? "Unknown Venue",
      city: row.venueCity ?? null,
      state: row.venueState ?? null,
    },
    category: {
      name: row.categoryName ?? "Uncategorized",
      icon: row.categoryIcon ?? null,
      slug: row.categorySlug ?? "other",
    },
    externalSource: row.event.externalSource,
    distance_km: null,
  };
}

// ---------------------------------------------------------------------------
// toEventDetail — full relational query → detail page shape
// ---------------------------------------------------------------------------

export function toEventDetail(dbEvent: EventDetailResult) {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    slug: dbEvent.slug,
    description: dbEvent.description ?? "",
    shortDescription: dbEvent.shortDescription,
    startDate: dbEvent.startDate,
    endDate: dbEvent.endDate,
    doorsOpen: dbEvent.doorsOpen,
    imageUrl: dbEvent.imageUrl,
    thumbnailUrl: dbEvent.thumbnailUrl,
    minPrice: dbEvent.minPrice,
    maxPrice: dbEvent.maxPrice,
    isFree: dbEvent.isFree,
    status: dbEvent.status,
    isFeatured: dbEvent.isFeatured,
    tags: dbEvent.tags ?? [],
    externalSource: dbEvent.externalSource,
    externalUrl: dbEvent.externalUrl,
    venue: dbEvent.venue,
    category: dbEvent.category,
    ticketTypes: dbEvent.ticketTypes,
    artists: dbEvent.eventArtists.map((ea) => ({
      id: ea.artist.id,
      name: ea.artist.name,
      slug: ea.artist.slug,
      imageUrl: ea.artist.imageUrl,
      isHeadliner: ea.isHeadliner,
    })),
  };
}

export type EventDetail = ReturnType<typeof toEventDetail>;
