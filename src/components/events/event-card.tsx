import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatPrice } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";

export interface EventCardEvent {
  id: string;
  title: string;
  slug: string;
  startDate: Date;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  isFree: boolean;
  venue: {
    name: string;
    city: string | null;
    state: string | null;
  };
  category: {
    name: string;
    icon: string | null;
    slug: string;
  };
  externalSource: string | null;
  distance_km: number | null;
}

interface EventCardProps {
  event: EventCardEvent;
}

function getPriceDisplay(event: EventCardEvent): string {
  if (event.isFree) return "Free";
  if (event.minPrice != null && event.maxPrice != null) {
    if (event.minPrice === event.maxPrice) return formatPrice(event.minPrice);
    return `${formatPrice(event.minPrice)} - ${formatPrice(event.maxPrice)}`;
  }
  if (event.minPrice != null) return `From ${formatPrice(event.minPrice)}`;
  if (event.maxPrice != null) return `Up to ${formatPrice(event.maxPrice)}`;
  return "See details";
}

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

export function EventCard({ event }: EventCardProps) {
  const imageSrc = event.thumbnailUrl || event.imageUrl;
  const venueLocation = [event.venue.city, event.venue.state]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      aria-label={`${event.title} at ${event.venue.name}`}
    >
      <Card className="overflow-hidden gap-0 py-0 transition-shadow duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5 group-hover:shadow-black/10">
        {/* Image Section - 16:9 aspect ratio */}
        <div className="relative aspect-video overflow-hidden">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={event.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary flex items-center justify-center">
              <span className="text-4xl" role="img" aria-label={event.category.name}>
                {event.category.icon || "🎶"}
              </span>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground shadow-sm">
              <span aria-hidden="true">{event.category.icon}</span>
              {event.category.name}
            </Badge>
          </div>

          {/* External Source Badge */}
          {event.externalSource && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="bg-background/90 backdrop-blur-sm text-xs shadow-sm">
                {getSourceLabel(event.externalSource)}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-2 p-4">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <time dateTime={event.startDate.toISOString()}>
              {formatEventDate(event.startDate)}
            </time>
          </div>

          {/* Title */}
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Venue + Location */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {event.venue.name}
              {venueLocation && ` \u00B7 ${venueLocation}`}
            </span>
          </div>

          {/* Price + Distance */}
          <div className="flex items-center justify-between pt-1">
            <span
              className={`text-sm font-medium ${
                event.isFree ? "text-green-600 dark:text-green-400" : "text-foreground"
              }`}
            >
              {getPriceDisplay(event)}
            </span>

            {event.distance_km != null && (
              <span className="text-xs text-muted-foreground">
                {event.distance_km < 1
                  ? "< 1 km away"
                  : `${Math.round(event.distance_km)} km away`}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
