/**
 * Tag taxonomy for sub-filtering within event categories.
 *
 * Each category has a list of canonical tags. External sources use
 * varied naming; the tag normalizer maps those to these canonical forms.
 */

export const TAG_TAXONOMY: Record<string, string[]> = {
  concerts: [
    "rock",
    "indie",
    "hip-hop",
    "jazz",
    "blues",
    "folk",
    "classical",
    "metal",
    "punk",
    "latin",
    "country",
    "r-and-b",
    "pop",
    "alternative",
    "singer-songwriter",
    "world-music",
  ],
  nightlife: [
    "edm",
    "house",
    "techno",
    "dj-set",
    "dance-party",
    "karaoke",
    "drag-show",
    "club-night",
  ],
  comedy: [
    "stand-up",
    "improv",
    "sketch",
    "open-mic",
    "comedy-show",
  ],
  theater: [
    "musical",
    "play",
    "broadway",
    "off-broadway",
    "one-person-show",
    "puppet-show",
  ],
  arts: [
    "gallery-opening",
    "art-walk",
    "installation",
    "film-screening",
    "photography",
    "dance-performance",
    "literary",
    "poetry",
  ],
  sports: [
    "basketball",
    "football",
    "baseball",
    "soccer",
    "hockey",
    "mma",
    "boxing",
    "wrestling",
    "tennis",
    "esports",
  ],
  community: [
    "market",
    "meetup",
    "workshop",
    "class",
    "food-festival",
    "charity",
    "family",
    "parade",
    "block-party",
  ],
  festivals: [
    "music-festival",
    "food-and-drink",
    "cultural",
    "street-fair",
    "art-festival",
    "beer-festival",
    "wine-festival",
  ],
};

/** Flat set of all valid tags for validation. */
export const ALL_TAGS = new Set(
  Object.values(TAG_TAXONOMY).flat()
);
