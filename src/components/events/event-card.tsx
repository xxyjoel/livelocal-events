import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventCardImage } from "@/components/events/event-image";
import { formatEventDate, formatPrice } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Music,
  Mic2,
  Theater,
  Trophy,
  Palette,
  PartyPopper,
  Users,
  Moon,
  Calendar,
} from "lucide-react";

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

const CATEGORY_PLACEHOLDERS: Record<string, { gradient: string; Icon: typeof Music }> = {
  concerts:  { gradient: "from-violet-600/30 via-purple-500/20 to-fuchsia-500/30", Icon: Music },
  comedy:    { gradient: "from-amber-500/30 via-yellow-400/20 to-orange-500/30", Icon: Mic2 },
  theater:   { gradient: "from-rose-600/30 via-pink-500/20 to-red-500/30", Icon: Theater },
  sports:    { gradient: "from-emerald-600/30 via-green-500/20 to-teal-500/30", Icon: Trophy },
  arts:      { gradient: "from-cyan-600/30 via-sky-500/20 to-blue-500/30", Icon: Palette },
  festivals: { gradient: "from-orange-500/30 via-red-400/20 to-pink-500/30", Icon: PartyPopper },
  community: { gradient: "from-teal-600/30 via-emerald-500/20 to-green-500/30", Icon: Users },
  nightlife: { gradient: "from-indigo-600/30 via-violet-500/20 to-purple-500/30", Icon: Moon },
};

const DEFAULT_PLACEHOLDER = { gradient: "from-slate-600/30 via-slate-500/20 to-slate-400/30", Icon: Calendar };

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
            <EventCardImage
              src={imageSrc}
              alt={event.title}
              categorySlug={event.category.slug}
              categoryName={event.category.name}
            />
          ) : (() => {
            const { gradient, Icon } = CATEGORY_PLACEHOLDERS[event.category.slug] ?? DEFAULT_PLACEHOLDER;
            return (
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
                <Icon className="size-10 text-foreground/25" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-xs font-medium uppercase tracking-widest text-foreground/30">
                  {event.category.name}
                </span>
              </div>
            );
          })()}

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
