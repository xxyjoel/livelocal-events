/**
 * Normalizes source-specific tags to canonical forms defined in the
 * tag taxonomy.
 *
 * Used by all sync modules (Ticketmaster, SeatGeek, Facebook) to produce
 * consistent tags across sources.
 */

import { ALL_TAGS } from "@/lib/config/tags";

/**
 * Mapping from source-specific tag names to our canonical tag names.
 * Keys are lowercased. Values must exist in TAG_TAXONOMY.
 */
const TAG_ALIASES: Record<string, string> = {
  // Genre / music style aliases
  "dance/electronic": "edm",
  "dance-electronic": "edm",
  "electronic": "edm",
  "electronic/dance": "edm",
  "dance": "edm",
  "hip-hop/rap": "hip-hop",
  "hip hop": "hip-hop",
  "rap": "hip-hop",
  "r&b": "r-and-b",
  "rnb": "r-and-b",
  "rhythm-and-blues": "r-and-b",
  "rhythm and blues": "r-and-b",
  "soul": "r-and-b",
  "soul/r&b": "r-and-b",
  "rock": "rock",
  "rock/pop": "rock",
  "hard-rock": "rock",
  "classic-rock": "rock",
  "soft-rock": "rock",
  "indie-rock": "indie",
  "indie": "indie",
  "indie-pop": "indie",
  "alternative": "alternative",
  "alt-rock": "alternative",
  "alt-country": "alternative",
  "folk": "folk",
  "folk-rock": "folk",
  "americana": "folk",
  "bluegrass": "folk",
  "jazz": "jazz",
  "smooth-jazz": "jazz",
  "blues": "blues",
  "country": "country",
  "country-music": "country",
  "classical": "classical",
  "orchestral": "classical",
  "symphony": "classical",
  "opera": "classical",
  "chamber-music": "classical",
  "metal": "metal",
  "heavy-metal": "metal",
  "death-metal": "metal",
  "black-metal": "metal",
  "thrash-metal": "metal",
  "punk": "punk",
  "punk-rock": "punk",
  "pop-punk": "punk",
  "hardcore": "punk",
  "latin": "latin",
  "latin-music": "latin",
  "reggaeton": "latin",
  "salsa": "latin",
  "pop": "pop",
  "pop-music": "pop",
  "singer-songwriter": "singer-songwriter",
  "singer/songwriter": "singer-songwriter",
  "acoustic": "singer-songwriter",
  "world": "world-music",
  "world-music": "world-music",
  "reggae": "world-music",

  // Nightlife aliases
  "house": "house",
  "house-music": "house",
  "deep-house": "house",
  "tech-house": "house",
  "techno": "techno",
  "trance": "techno",
  "drum-and-bass": "techno",
  "dj": "dj-set",
  "dj-set": "dj-set",
  "dj-night": "dj-set",
  "dance-party": "dance-party",
  "club": "club-night",
  "club-night": "club-night",
  "nightlife": "club-night",
  "karaoke": "karaoke",
  "drag": "drag-show",
  "drag-show": "drag-show",

  // Comedy aliases
  "stand-up": "stand-up",
  "standup": "stand-up",
  "stand-up-comedy": "stand-up",
  "comedy": "comedy-show",
  "comedy-show": "comedy-show",
  "improv": "improv",
  "improvisation": "improv",
  "sketch": "sketch",
  "sketch-comedy": "sketch",
  "open-mic": "open-mic",
  "open-mike": "open-mic",

  // Theater aliases
  "musical": "musical",
  "musical-theater": "musical",
  "musical-theatre": "musical",
  "play": "play",
  "drama": "play",
  "broadway": "broadway",
  "broadway-tickets-national": "broadway",

  // Arts aliases
  "film": "film-screening",
  "movie": "film-screening",
  "film-screening": "film-screening",
  "gallery": "gallery-opening",
  "gallery-opening": "gallery-opening",
  "art-walk": "art-walk",
  "dance-performance": "dance-performance",
  "dance-performance-tour": "dance-performance",
  "ballet": "dance-performance",
  "modern-dance": "dance-performance",
  "literary": "literary",
  "book-reading": "literary",
  "poetry": "poetry",
  "spoken-word": "poetry",
  "photography": "photography",

  // Sports aliases
  "basketball": "basketball",
  "nba": "basketball",
  "football": "football",
  "nfl": "football",
  "baseball": "baseball",
  "mlb": "baseball",
  "soccer": "soccer",
  "mls": "soccer",
  "hockey": "hockey",
  "nhl": "hockey",
  "mma": "mma",
  "ufc": "mma",
  "boxing": "boxing",
  "wrestling": "wrestling",
  "wwe": "wrestling",
  "tennis": "tennis",
  "esports": "esports",
  "e-sports": "esports",
  "gaming": "esports",

  // Community aliases
  "family": "family",
  "kids": "family",
  "children": "family",
  "market": "market",
  "farmers-market": "market",
  "flea-market": "market",
  "meetup": "meetup",
  "networking": "meetup",
  "workshop": "workshop",
  "class": "class",
  "seminar": "class",
  "lecture": "class",
  "charity": "charity",
  "fundraiser": "charity",
  "benefit": "charity",
  "block-party": "block-party",
  "parade": "parade",

  // Festival aliases
  "festival": "music-festival",
  "festivals": "music-festival",
  "music-festival": "music-festival",
  "food-and-drink": "food-and-drink",
  "food-festival": "food-and-drink",
  "beer-festival": "beer-festival",
  "wine-festival": "wine-festival",
  "cultural": "cultural",
  "street-fair": "street-fair",
  "art-festival": "art-festival",
};

/**
 * Normalize a raw tag from any source to our canonical form.
 *
 * @param raw - The raw tag string from an external source
 * @returns The canonical tag, or null if no mapping exists
 */
export function normalizeTag(raw: string): string | null {
  const key = raw.toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[^\w-]/g, "");

  // Direct match in taxonomy
  if (ALL_TAGS.has(key)) return key;

  // Check aliases
  const alias = TAG_ALIASES[key];
  if (alias && ALL_TAGS.has(alias)) return alias;

  return null;
}

/**
 * Normalize a list of raw tags from any source, deduplicating and
 * filtering out unmappable tags.
 *
 * @param rawTags - Raw tag strings from an external source
 * @returns Array of unique canonical tags
 */
export function normalizeTags(rawTags: string[]): string[] {
  const result = new Set<string>();

  for (const raw of rawTags) {
    const normalized = normalizeTag(raw);
    if (normalized) result.add(normalized);
  }

  return Array.from(result);
}
