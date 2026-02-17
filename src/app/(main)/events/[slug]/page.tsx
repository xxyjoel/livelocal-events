import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Music,
  Tag,
  Ticket,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EventCard } from "@/components/events/event-card";
import { ShareButton } from "@/components/events/share-button";
import { formatEventDate, formatPrice } from "@/lib/utils";
import { getEventBySlug, getSimilarEvents } from "@/lib/db/queries/events";
import { toEventDetail, toEventCard } from "@/lib/db/mappers";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

// ---- SEO Metadata ----

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dbEvent = await getEventBySlug(slug);

  if (!dbEvent) {
    return { title: "Event Not Found" };
  }

  const event = toEventDetail(dbEvent);
  const description =
    event.shortDescription || event.description.slice(0, 160);

  return {
    title: `${event.title} | ${SITE_NAME}`,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "website",
      url: `${SITE_URL}/events/${event.slug}`,
      ...(event.imageUrl && {
        images: [{ url: event.imageUrl, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
    },
  };
}

// ---- Helper functions ----

function getSourceLabel(source: string): string {
  switch (source.toLowerCase()) {
    case "ticketmaster":
      return "Ticketmaster";
    case "seatgeek":
      return "SeatGeek";
    default:
      return source;
  }
}

function getPriceDisplay(event: {
  isFree: boolean;
  minPrice: number | null;
  maxPrice: number | null;
}): string {
  if (event.isFree) return "Free";
  if (event.minPrice != null && event.maxPrice != null) {
    if (event.minPrice === event.maxPrice) return formatPrice(event.minPrice);
    return `${formatPrice(event.minPrice)} - ${formatPrice(event.maxPrice)}`;
  }
  if (event.minPrice != null) return `From ${formatPrice(event.minPrice)}`;
  if (event.maxPrice != null) return `Up to ${formatPrice(event.maxPrice)}`;
  return "See details";
}

// ---- Page Component ----

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbEvent = await getEventBySlug(slug);

  if (!dbEvent) {
    notFound();
  }

  const event = toEventDetail(dbEvent);
  const similarDbEvents = await getSimilarEvents(event.id, dbEvent.categoryId, 4);
  const similarEvents = similarDbEvents.map(toEventCard);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.shortDescription || event.description.slice(0, 300),
    startDate: event.startDate.toISOString(),
    ...(event.endDate && { endDate: event.endDate.toISOString() }),
    ...(event.doorsOpen && {
      doorTime: event.doorsOpen.toISOString(),
    }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venue.address,
        addressLocality: event.venue.city,
        addressRegion: event.venue.state,
        postalCode: event.venue.zipCode,
        addressCountry: "US",
      },
      ...(event.venue.latitude &&
        event.venue.longitude && {
          geo: {
            "@type": "GeoCoordinates",
            latitude: event.venue.latitude,
            longitude: event.venue.longitude,
          },
        }),
    },
    ...(event.imageUrl && { image: [event.imageUrl] }),
    offers: event.isFree
      ? {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        }
      : event.minPrice != null
        ? {
            "@type": "AggregateOffer",
            lowPrice: (event.minPrice / 100).toFixed(2),
            ...(event.maxPrice != null && {
              highPrice: (event.maxPrice / 100).toFixed(2),
            }),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          }
        : undefined,
    ...(event.artists.length > 0 && {
      performer: event.artists.map((a) => ({
        "@type": "PerformingGroup",
        name: a.name,
      })),
    }),
  };

  const venueLocation = [event.venue.city, event.venue.state]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Mobile sticky ticket CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className={`text-lg font-bold ${
                event.isFree ? "text-green-600 dark:text-green-400" : ""
              }`}
            >
              {getPriceDisplay(event)}
            </p>
          </div>
          {event.externalUrl ? (
            <Button asChild size="lg" className="min-h-12 flex-1">
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                Get Tickets
              </a>
            </Button>
          ) : event.isFree ? (
            <Button size="lg" variant="secondary" className="min-h-12 flex-1">
              <Users className="size-4" />
              RSVP
            </Button>
          ) : event.ticketTypes.length > 0 ? (
            <Button asChild size="lg" className="min-h-12 flex-1">
              <Link href={`/checkout/${event.id}`}>
                Buy Tickets
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-64 w-full overflow-hidden sm:h-80 md:h-96">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: event.category.color
                ? `linear-gradient(135deg, ${event.category.color}33 0%, ${event.category.color}11 50%, hsl(var(--secondary)) 100%)`
                : undefined,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary" />
          </div>
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                <span aria-hidden="true">{event.category.icon}</span>
                {event.category.name}
              </Badge>
              {event.isFeatured && (
                <Badge className="bg-amber-500 text-white">Featured</Badge>
              )}
              {event.externalSource && (
                <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                  {getSourceLabel(event.externalSource)}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              {event.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:px-8 lg:pb-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Event Details */}
          <div className="space-y-8 lg:col-span-2">
            {/* Date & Time Card */}
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-primary" aria-hidden="true" />
                <time dateTime={event.startDate.toISOString()} className="font-medium text-foreground">
                  {format(event.startDate, "EEEE, MMMM d, yyyy")}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-primary" aria-hidden="true" />
                <span className="font-medium text-foreground">
                  {format(event.startDate, "h:mm a")}
                  {event.endDate && ` - ${format(event.endDate, "h:mm a")}`}
                </span>
              </div>
              {event.doorsOpen && (
                <span className="text-sm">
                  Doors open at {format(event.doorsOpen, "h:mm a")}
                </span>
              )}
              <div className="ml-auto">
                <ShareButton />
              </div>
            </div>

            <Separator />

            {/* Description */}
            <section>
              <h2 className="text-xl font-semibold">About This Event</h2>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </section>

            <Separator />

            {/* Venue Section */}
            <section>
              <h2 className="text-xl font-semibold">Venue</h2>
              <div className="mt-4 flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{event.venue.name}</p>
                  {event.venue.address && (
                    <p className="text-sm text-muted-foreground">
                      {event.venue.address}
                    </p>
                  )}
                  {venueLocation && (
                    <p className="text-sm text-muted-foreground">
                      {venueLocation}
                      {event.venue.zipCode && ` ${event.venue.zipCode}`}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Artists / Lineup */}
            {event.artists.length > 0 && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xl font-semibold">Lineup</h2>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {event.artists
                      .sort((a, b) =>
                        a.isHeadliner === b.isHeadliner
                          ? 0
                          : a.isHeadliner
                            ? -1
                            : 1
                      )
                      .map((artist) => (
                        <div
                          key={artist.id}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Music className="size-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{artist.name}</p>
                            {artist.isHeadliner && (
                              <Badge variant="secondary" className="mt-0.5 text-xs">
                                Headliner
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              </>
            )}

            {/* Tags */}
            {event.tags.length > 0 && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xl font-semibold">Tags</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        <Tag className="size-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Similar Events */}
            {similarEvents.length > 0 && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xl font-semibold">Similar Events</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {similarEvents.map((evt) => (
                      <EventCard key={evt.id} event={evt} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Right Column - Ticket Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="size-5" />
                    Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price display */}
                  <div className="text-center">
                    <p
                      className={`text-2xl font-bold ${
                        event.isFree
                          ? "text-green-600 dark:text-green-400"
                          : ""
                      }`}
                    >
                      {getPriceDisplay(event)}
                    </p>
                    {event.isFree && (
                      <Badge
                        variant="secondary"
                        className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      >
                        Free Event
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* External ticket source */}
                  {event.externalUrl ? (
                    <div className="space-y-3">
                      <p className="text-center text-sm text-muted-foreground">
                        Tickets available on{" "}
                        {event.externalSource
                          ? getSourceLabel(event.externalSource)
                          : "external site"}
                      </p>
                      <Button asChild className="w-full" size="lg">
                        <a
                          href={event.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4" />
                          Get Tickets on{" "}
                          {event.externalSource
                            ? getSourceLabel(event.externalSource)
                            : "External Site"}
                        </a>
                      </Button>
                    </div>
                  ) : event.isFree ? (
                    /* Free event RSVP */
                    <div className="space-y-3">
                      <p className="text-center text-sm text-muted-foreground">
                        No tickets required for this free event.
                      </p>
                      <Button className="w-full" size="lg" variant="secondary">
                        <Users className="size-4" />
                        RSVP
                      </Button>
                    </div>
                  ) : event.ticketTypes.length > 0 ? (
                    /* Native ticket types */
                    <div className="space-y-4">
                      {event.ticketTypes.map((tt) => {
                        const remaining = tt.quantity - tt.sold;
                        const isSoldOut = remaining <= 0;

                        return (
                          <div
                            key={tt.id}
                            className={`rounded-lg border p-3 ${
                              isSoldOut ? "opacity-60" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{tt.name}</p>
                              <p className="font-semibold">
                                {formatPrice(tt.price)}
                              </p>
                            </div>
                            {tt.description && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {tt.description}
                              </p>
                            )}
                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                              {isSoldOut ? (
                                <Badge variant="destructive" className="text-xs">
                                  Sold Out
                                </Badge>
                              ) : remaining <= 20 ? (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  Only {remaining} left
                                </span>
                              ) : (
                                <span>Available</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <Button asChild className="w-full" size="lg">
                        <Link href={`/checkout/${event.id}`}>
                          Buy Tickets
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    /* No ticket info available */
                    <div className="space-y-3">
                      <p className="text-center text-sm text-muted-foreground">
                        Ticket information coming soon.
                      </p>
                    </div>
                  )}

                  {/* Event quick info */}
                  <Separator />
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 shrink-0" />
                      <span>{formatEventDate(event.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0" />
                      <span>{event.venue.name}</span>
                    </div>
                    {venueLocation && (
                      <div className="flex items-center gap-2">
                        <span className="size-4 shrink-0" />
                        <span className="text-xs">{venueLocation}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
