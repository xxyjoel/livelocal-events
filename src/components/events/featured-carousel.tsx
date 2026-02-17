import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EventCarouselImage } from "@/components/events/event-image";
import { formatEventDate } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Music,
  Mic2,
  Theater,
  Trophy,
  Palette,
  PartyPopper,
  Users,
  Moon,
} from "lucide-react";
import { type EventCardEvent } from "./event-card";

const CATEGORY_PLACEHOLDERS: Record<string, { gradient: string; Icon: typeof Music }> = {
  concerts:  { gradient: "from-violet-600/40 via-purple-500/30 to-fuchsia-500/40", Icon: Music },
  comedy:    { gradient: "from-amber-500/40 via-yellow-400/30 to-orange-500/40", Icon: Mic2 },
  theater:   { gradient: "from-rose-600/40 via-pink-500/30 to-red-500/40", Icon: Theater },
  sports:    { gradient: "from-emerald-600/40 via-green-500/30 to-teal-500/40", Icon: Trophy },
  arts:      { gradient: "from-cyan-600/40 via-sky-500/30 to-blue-500/40", Icon: Palette },
  festivals: { gradient: "from-orange-500/40 via-red-400/30 to-pink-500/40", Icon: PartyPopper },
  community: { gradient: "from-teal-600/40 via-emerald-500/30 to-green-500/40", Icon: Users },
  nightlife: { gradient: "from-indigo-600/40 via-violet-500/30 to-purple-500/40", Icon: Moon },
};

const DEFAULT_PLACEHOLDER = { gradient: "from-slate-600/40 via-slate-500/30 to-slate-400/40", Icon: Calendar };

interface FeaturedCarouselProps {
  events: EventCardEvent[];
}

export function FeaturedCarousel({ events }: FeaturedCarouselProps) {
  if (events.length === 0) return null;

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
      role="region"
      aria-label="Featured events"
    >
      {events.map((event) => {
        const imageSrc = event.imageUrl || event.thumbnailUrl;
        const venueLocation = [event.venue.city, event.venue.state]
          .filter(Boolean)
          .join(", ");

        return (
          <Link
            key={event.id}
            href={`/events/${event.slug}`}
            className="group block shrink-0 snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl w-full sm:w-[calc(100%-2rem)] md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]"
            aria-label={`Featured: ${event.title} at ${event.venue.name}`}
          >
            <div className="relative aspect-[16/7] sm:aspect-[16/8] overflow-hidden rounded-xl">
              {/* Background Image */}
              {imageSrc ? (
                <EventCarouselImage
                  src={imageSrc}
                  alt={event.title}
                  categorySlug={event.category.slug}
                  categoryName={event.category.name}
                />
              ) : (() => {
                const { gradient, Icon } = CATEGORY_PLACEHOLDERS[event.category.slug] ?? DEFAULT_PLACEHOLDER;
                return (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-3`}>
                    <Icon className="size-14 text-foreground/20" strokeWidth={1.5} aria-hidden="true" />
                    <span className="text-sm font-medium uppercase tracking-widest text-foreground/25">
                      {event.category.name}
                    </span>
                  </div>
                );
              })()}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Category Badge */}
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-white/20">
                  <span aria-hidden="true">{event.category.icon}</span>
                  {event.category.name}
                </Badge>
              </div>

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight line-clamp-2 group-hover:underline decoration-2 underline-offset-2">
                  {event.title}
                </h3>

                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-white/90">
                    <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
                    <time dateTime={event.startDate.toISOString()}>
                      {formatEventDate(event.startDate)}
                    </time>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-white/90">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {event.venue.name}
                      {venueLocation && ` \u00B7 ${venueLocation}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
