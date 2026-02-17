"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Mic2,
  Moon,
  Music,
  Palette,
  PartyPopper,
  Theater,
  Trophy,
  Users,
} from "lucide-react";

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

interface CategoryPlaceholderProps {
  categorySlug: string;
  categoryName: string;
  iconSize?: string;
  textSize?: string;
  gap?: string;
}

function CategoryPlaceholder({ categorySlug, categoryName, iconSize = "size-20", textSize = "text-base", gap = "gap-4" }: CategoryPlaceholderProps) {
  const { gradient, Icon } = CATEGORY_PLACEHOLDERS[categorySlug] ?? DEFAULT_PLACEHOLDER;
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center ${gap}`}>
      <Icon className={`${iconSize} text-foreground/15`} strokeWidth={1.5} aria-hidden="true" />
      <span className={`${textSize} font-medium uppercase tracking-widest text-foreground/20`}>
        {categoryName}
      </span>
    </div>
  );
}

interface EventHeroImageProps {
  src: string | null;
  alt: string;
  categorySlug: string;
  categoryName: string;
}

export function EventHeroImage({ src, alt, categorySlug, categoryName }: EventHeroImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <CategoryPlaceholder categorySlug={categorySlug} categoryName={categoryName} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      className="object-cover"
      sizes="100vw"
      onError={() => setFailed(true)}
    />
  );
}

interface EventCardImageProps {
  src: string;
  alt: string;
  categorySlug: string;
  categoryName: string;
  sizes?: string;
  priority?: boolean;
}

export function EventCardImage({ src, alt, categorySlug, categoryName, sizes, priority }: EventCardImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <CategoryPlaceholder
        categorySlug={categorySlug}
        categoryName={categoryName}
        iconSize="size-10"
        textSize="text-xs"
        gap="gap-2"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
      className="object-cover transition-transform duration-200 group-hover:scale-105"
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}

interface EventCarouselImageProps {
  src: string;
  alt: string;
  categorySlug: string;
  categoryName: string;
}

export function EventCarouselImage({ src, alt, categorySlug, categoryName }: EventCarouselImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <CategoryPlaceholder
        categorySlug={categorySlug}
        categoryName={categoryName}
        iconSize="size-14"
        textSize="text-sm"
        gap="gap-3"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      priority
      onError={() => setFailed(true)}
    />
  );
}
