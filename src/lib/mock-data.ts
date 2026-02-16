import { type EventCardEvent } from "@/components/events/event-card";
import { addDays, addHours, setHours, setMinutes } from "date-fns";

// ---- Types for the detail page ----

export interface MockTicketType {
  id: string;
  name: string;
  description: string | null;
  price: number; // cents
  quantity: number;
  sold: number;
  maxPerOrder: number;
}

export interface MockArtist {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isHeadliner: boolean;
}

export interface MockEventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  startDate: Date;
  endDate: Date | null;
  doorsOpen: Date | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  isFree: boolean;
  status: "draft" | "published" | "cancelled" | "soldout" | "completed";
  isFeatured: boolean;
  tags: string[];
  externalSource: string | null;
  externalUrl: string | null;
  venue: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  };
  ticketTypes: MockTicketType[];
  artists: MockArtist[];
}

// ---- Helper to create dates relative to now ----

function futureDate(daysFromNow: number, hour: number, minute: number = 0): Date {
  const d = addDays(new Date(), daysFromNow);
  return setMinutes(setHours(d, hour), minute);
}

// ---- Mock event database ----

const MOCK_EVENTS: MockEventDetail[] = [
  {
    id: "evt_01",
    title: "Midnight Reverie - Live Jazz & Soul",
    slug: "midnight-reverie-live-jazz-soul",
    description: `Step into the warm, golden glow of The Blue Note Lounge for an unforgettable evening of live jazz and soul music. Midnight Reverie brings together some of the city's finest musicians for a night that celebrates the timeless art of improvisation and soulful expression.

The evening opens with an intimate acoustic set from emerging vocalist Maya Chen, whose honey-toned voice and original compositions have been captivating audiences across the local scene. Following Maya, the acclaimed Reverie Quartet takes the stage with their signature blend of modern jazz, neo-soul, and classic standards.

Expect lush horn arrangements, nimble piano work, deep grooves from the rhythm section, and the kind of musical chemistry that only happens when world-class musicians share a stage.

The Blue Note Lounge offers a full craft cocktail menu and light bites throughout the evening. Doors open at 7 PM with the first set beginning at 8 PM. A second set follows at 10 PM for those who want to keep the night going.

Whether you're a lifelong jazz aficionado or discovering the genre for the first time, Midnight Reverie promises a night of beauty, spontaneity, and connection through music.`,
    shortDescription: "An intimate evening of live jazz and soul at The Blue Note Lounge featuring Maya Chen and the Reverie Quartet.",
    startDate: futureDate(3, 20, 0),
    endDate: futureDate(4, 0, 30),
    doorsOpen: futureDate(3, 19, 0),
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: 2500,
    maxPrice: 7500,
    isFree: false,
    status: "published",
    isFeatured: true,
    tags: ["jazz", "soul", "live-music", "intimate", "date-night"],
    externalSource: null,
    externalUrl: null,
    venue: {
      id: "ven_01",
      name: "The Blue Note Lounge",
      slug: "the-blue-note-lounge",
      address: "142 W Main Street",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      latitude: 30.2672,
      longitude: -97.7431,
    },
    category: {
      id: "cat_01",
      name: "Concert",
      slug: "concerts",
      icon: "🎵",
      color: "#8B5CF6",
    },
    ticketTypes: [
      {
        id: "tt_01",
        name: "General Admission",
        description: "Standing room with access to both sets",
        price: 2500,
        quantity: 150,
        sold: 87,
        maxPerOrder: 6,
      },
      {
        id: "tt_02",
        name: "Reserved Table (2 guests)",
        description: "Premium table seating with complimentary drink",
        price: 7500,
        quantity: 20,
        sold: 14,
        maxPerOrder: 2,
      },
    ],
    artists: [
      {
        id: "art_01",
        name: "Maya Chen",
        slug: "maya-chen",
        imageUrl: null,
        isHeadliner: false,
      },
      {
        id: "art_02",
        name: "Reverie Quartet",
        slug: "reverie-quartet",
        imageUrl: null,
        isHeadliner: true,
      },
    ],
  },
  {
    id: "evt_02",
    title: "Comedy Night: Stand-Up Showcase",
    slug: "comedy-night-stand-up-showcase",
    description: `Get ready to laugh until your sides hurt! The Laugh Factory presents its monthly Stand-Up Showcase featuring five of the funniest emerging comedians in the region.

This month's lineup includes nationally touring comics and local favorites alike, each bringing their unique perspective and razor-sharp wit to the stage. From observational humor to storytelling to absurdist bits, there's something for every comedy fan.

The show is hosted by the incomparable DJ Ramirez, whose quick improvisational skills and audience interaction segments keep the energy high between sets.

This is a 21+ show. Full bar available. Arrive early for best seating -- tables are first-come, first-served after doors open.`,
    shortDescription: "Five hilarious comics take the stage for a can't-miss night of stand-up comedy.",
    startDate: futureDate(1, 20, 30),
    endDate: futureDate(1, 23, 0),
    doorsOpen: futureDate(1, 19, 30),
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: 1500,
    maxPrice: 1500,
    isFree: false,
    status: "published",
    isFeatured: false,
    tags: ["comedy", "stand-up", "nightlife", "21+"],
    externalSource: null,
    externalUrl: null,
    venue: {
      id: "ven_02",
      name: "The Laugh Factory",
      slug: "the-laugh-factory",
      address: "88 East 6th Street",
      city: "Austin",
      state: "TX",
      zipCode: "78702",
      latitude: 30.2669,
      longitude: -97.7388,
    },
    category: {
      id: "cat_02",
      name: "Comedy",
      slug: "comedy",
      icon: "😂",
      color: "#F59E0B",
    },
    ticketTypes: [
      {
        id: "tt_03",
        name: "General Admission",
        description: null,
        price: 1500,
        quantity: 200,
        sold: 143,
        maxPerOrder: 8,
      },
    ],
    artists: [],
  },
  {
    id: "evt_03",
    title: "Summer Sounds Festival 2026",
    slug: "summer-sounds-festival-2026",
    description: `The Summer Sounds Festival returns for its 8th year! Join thousands of music lovers for a full day of incredible live performances across three stages in Zilker Park.

This year's festival features an eclectic mix of genres including indie rock, electronic, hip-hop, and Americana. With food trucks, local craft vendors, art installations, and family-friendly activities, Summer Sounds is more than a music festival -- it's a celebration of community.

Gates open at 11 AM. Music runs from noon until 10 PM. Re-entry is permitted with wristband.

Bring blankets and lawn chairs. Outside food and beverages are not permitted. Free water refill stations are available throughout the park.`,
    shortDescription: "A full day of live music across three stages featuring 20+ artists at Zilker Park.",
    startDate: futureDate(14, 12, 0),
    endDate: futureDate(14, 22, 0),
    doorsOpen: futureDate(14, 11, 0),
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: 4500,
    maxPrice: 15000,
    isFree: false,
    status: "published",
    isFeatured: true,
    tags: ["festival", "outdoor", "multi-stage", "family-friendly"],
    externalSource: "ticketmaster",
    externalUrl: "https://www.ticketmaster.com/event/example",
    venue: {
      id: "ven_03",
      name: "Zilker Park",
      slug: "zilker-park",
      address: "2100 Barton Springs Rd",
      city: "Austin",
      state: "TX",
      zipCode: "78704",
      latitude: 30.2669,
      longitude: -97.7725,
    },
    category: {
      id: "cat_04",
      name: "Festival",
      slug: "festivals",
      icon: "🎪",
      color: "#10B981",
    },
    ticketTypes: [],
    artists: [
      {
        id: "art_03",
        name: "The Wanderers",
        slug: "the-wanderers",
        imageUrl: null,
        isHeadliner: true,
      },
      {
        id: "art_04",
        name: "DJ Pulse",
        slug: "dj-pulse",
        imageUrl: null,
        isHeadliner: false,
      },
    ],
  },
  {
    id: "evt_04",
    title: "Community Art Walk & Open Studios",
    slug: "community-art-walk-open-studios",
    description: `Explore the vibrant local art scene during this free Community Art Walk! Over 30 artists open their studios and gallery spaces along the East Side Arts District for an afternoon of creativity, conversation, and discovery.

Meet the artists, see works in progress, enjoy live painting demonstrations, and find your next favorite piece. Many works will be available for purchase directly from the artists.

The Art Walk is family-friendly with special activities for kids including a collaborative mural project and a scavenger hunt across participating studios.

Live acoustic music accompanies the walk, with performers set up at various points along the route. Local food vendors will be stationed at the central courtyard.

No tickets required -- just show up and explore! Maps and guides will be available at the information booth at the corner of 5th and Pedernales.`,
    shortDescription: "A free afternoon exploring 30+ artist studios with live music, food, and family activities.",
    startDate: futureDate(5, 14, 0),
    endDate: futureDate(5, 19, 0),
    doorsOpen: null,
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: null,
    maxPrice: null,
    isFree: true,
    status: "published",
    isFeatured: false,
    tags: ["art", "free", "family-friendly", "outdoor", "community"],
    externalSource: null,
    externalUrl: null,
    venue: {
      id: "ven_04",
      name: "East Side Arts District",
      slug: "east-side-arts-district",
      address: "5th & Pedernales",
      city: "Austin",
      state: "TX",
      zipCode: "78702",
      latitude: 30.2621,
      longitude: -97.7227,
    },
    category: {
      id: "cat_07",
      name: "Arts",
      slug: "arts",
      icon: "🎨",
      color: "#F97316",
    },
    ticketTypes: [],
    artists: [],
  },
  {
    id: "evt_05",
    title: "Shakespeare in the Park: A Midsummer Night's Dream",
    slug: "shakespeare-in-the-park-midsummer",
    description: `Under the stars and ancient oaks, the Austin Repertory Theater presents Shakespeare's most beloved comedy: A Midsummer Night's Dream.

This enchanting outdoor production brings the fairy-filled forest to life with imaginative staging, original music, and a talented cast that makes Shakespeare's language feel fresh and accessible.

Bring a blanket or low lawn chair. Concessions available including local wine and craft beer. The show runs approximately 2 hours with one 15-minute intermission.

Rain date: the following evening.`,
    shortDescription: "An enchanting outdoor Shakespeare production under the stars.",
    startDate: futureDate(7, 20, 0),
    endDate: futureDate(7, 22, 15),
    doorsOpen: futureDate(7, 19, 0),
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: 2000,
    maxPrice: 5000,
    isFree: false,
    status: "published",
    isFeatured: false,
    tags: ["theater", "outdoor", "shakespeare", "family-friendly"],
    externalSource: null,
    externalUrl: null,
    venue: {
      id: "ven_05",
      name: "Pease Park Amphitheater",
      slug: "pease-park-amphitheater",
      address: "1100 Kingsbury St",
      city: "Austin",
      state: "TX",
      zipCode: "78703",
      latitude: 30.2801,
      longitude: -97.7501,
    },
    category: {
      id: "cat_03",
      name: "Theater",
      slug: "theater",
      icon: "🎭",
      color: "#EF4444",
    },
    ticketTypes: [
      {
        id: "tt_04",
        name: "Lawn Seating",
        description: "Bring your own blanket or chair",
        price: 2000,
        quantity: 300,
        sold: 210,
        maxPerOrder: 10,
      },
      {
        id: "tt_05",
        name: "Premium Seating",
        description: "Reserved chairs in the first 3 rows",
        price: 5000,
        quantity: 50,
        sold: 50,
        maxPerOrder: 4,
      },
    ],
    artists: [],
  },
  {
    id: "evt_06",
    title: "Neon Nights: Electronic Dance Party",
    slug: "neon-nights-electronic-dance-party",
    description: `Get ready to move! Neon Nights transforms The Warehouse into a pulsating wonderland of light, sound, and energy.

Featuring a state-of-the-art sound system, mesmerizing laser shows, and three of the hottest DJs in the Texas electronic scene, this is THE dance party of the month.

Dress code: neon and glow-in-the-dark encouraged! Free glow accessories at the door while supplies last.

21+ only. Valid ID required.`,
    shortDescription: "An electrifying dance party with top DJs, lasers, and neon vibes.",
    startDate: futureDate(2, 22, 0),
    endDate: futureDate(3, 3, 0),
    doorsOpen: futureDate(2, 21, 0),
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: 2000,
    maxPrice: 4000,
    isFree: false,
    status: "published",
    isFeatured: false,
    tags: ["electronic", "dance", "nightlife", "21+", "dj"],
    externalSource: null,
    externalUrl: null,
    venue: {
      id: "ven_06",
      name: "The Warehouse",
      slug: "the-warehouse",
      address: "501 Waller St",
      city: "Austin",
      state: "TX",
      zipCode: "78702",
      latitude: 30.2636,
      longitude: -97.7270,
    },
    category: {
      id: "cat_06",
      name: "Nightlife",
      slug: "nightlife",
      icon: "🌙",
      color: "#EC4899",
    },
    ticketTypes: [
      {
        id: "tt_06",
        name: "Early Bird",
        description: "Limited early bird pricing",
        price: 2000,
        quantity: 100,
        sold: 100,
        maxPerOrder: 4,
      },
      {
        id: "tt_07",
        name: "General Admission",
        description: null,
        price: 3000,
        quantity: 300,
        sold: 165,
        maxPerOrder: 6,
      },
      {
        id: "tt_08",
        name: "VIP",
        description: "VIP lounge access with complimentary drinks",
        price: 4000,
        quantity: 50,
        sold: 22,
        maxPerOrder: 4,
      },
    ],
    artists: [],
  },
  {
    id: "evt_07",
    title: "Sunday Farmers Market & Live Bluegrass",
    slug: "sunday-farmers-market-live-bluegrass",
    description: `Start your Sunday right at the weekly Farmers Market at Republic Square! Browse fresh produce, artisan goods, baked treats, and handmade crafts from over 60 local vendors.

This week features live bluegrass music from The Porch Pickers, making for a perfect morning of shopping, snacking, and toe-tapping tunes.

Free parking available in the adjacent garage. Bring your own reusable bags! Dogs on leashes are welcome.`,
    shortDescription: "Weekly farmers market with 60+ vendors and live bluegrass music.",
    startDate: futureDate(0, 9, 0),
    endDate: futureDate(0, 13, 0),
    doorsOpen: null,
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: null,
    maxPrice: null,
    isFree: true,
    status: "published",
    isFeatured: false,
    tags: ["market", "free", "family-friendly", "outdoor", "food"],
    externalSource: null,
    externalUrl: null,
    venue: {
      id: "ven_07",
      name: "Republic Square",
      slug: "republic-square",
      address: "422 Guadalupe St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      latitude: 30.2655,
      longitude: -97.7475,
    },
    category: {
      id: "cat_08",
      name: "Community",
      slug: "community",
      icon: "🤝",
      color: "#06B6D4",
    },
    ticketTypes: [],
    artists: [],
  },
  {
    id: "evt_08",
    title: "Indie Rock Night: Three Band Bill",
    slug: "indie-rock-night-three-band-bill",
    description: `Three incredible indie rock bands share the stage for one unforgettable night at Mohawk Austin.

Opening the evening is the garage-rock energy of Velvet Static, followed by the dreamy shoegaze of Lunar Tides. Headlining the night is the critically acclaimed Desert Hearts, touring in support of their new album "Echoes in the Canyon."

This is a standing-room show. The outdoor patio stage with Austin's skyline as the backdrop makes for one of the best live music experiences in the city.`,
    shortDescription: "Three indie rock bands take the stage at Mohawk Austin.",
    startDate: futureDate(4, 21, 0),
    endDate: futureDate(5, 0, 0),
    doorsOpen: futureDate(4, 20, 0),
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: 1800,
    maxPrice: 1800,
    isFree: false,
    status: "published",
    isFeatured: false,
    tags: ["indie", "rock", "live-music", "outdoor"],
    externalSource: "seatgeek",
    externalUrl: "https://seatgeek.com/event/example",
    venue: {
      id: "ven_08",
      name: "Mohawk Austin",
      slug: "mohawk-austin",
      address: "912 Red River St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      latitude: 30.2693,
      longitude: -97.7370,
    },
    category: {
      id: "cat_01",
      name: "Concert",
      slug: "concerts",
      icon: "🎵",
      color: "#8B5CF6",
    },
    ticketTypes: [],
    artists: [
      {
        id: "art_05",
        name: "Desert Hearts",
        slug: "desert-hearts",
        imageUrl: null,
        isHeadliner: true,
      },
      {
        id: "art_06",
        name: "Lunar Tides",
        slug: "lunar-tides",
        imageUrl: null,
        isHeadliner: false,
      },
      {
        id: "art_07",
        name: "Velvet Static",
        slug: "velvet-static",
        imageUrl: null,
        isHeadliner: false,
      },
    ],
  },
  {
    id: "evt_09",
    title: "Local Soccer: Austin FC Watch Party",
    slug: "austin-fc-watch-party",
    description: `Catch the big match on the big screen! Join fellow Austin FC fans for an electric watch party at Circuit of the Americas.

Giant LED screens, food and drink vendors, giveaways, and the energy of thousands of passionate supporters make this the best way to watch the game outside the stadium.

Family-friendly event. Kids 12 and under are free with a paying adult.`,
    shortDescription: "Austin FC watch party with giant screens and fan festivities.",
    startDate: futureDate(6, 17, 0),
    endDate: futureDate(6, 20, 0),
    doorsOpen: futureDate(6, 16, 0),
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: 1000,
    maxPrice: 1000,
    isFree: false,
    status: "published",
    isFeatured: false,
    tags: ["sports", "soccer", "watch-party", "family-friendly"],
    externalSource: null,
    externalUrl: null,
    venue: {
      id: "ven_09",
      name: "Circuit of the Americas",
      slug: "circuit-of-the-americas",
      address: "9201 Circuit of the Americas Blvd",
      city: "Austin",
      state: "TX",
      zipCode: "78617",
      latitude: 30.1328,
      longitude: -97.6411,
    },
    category: {
      id: "cat_05",
      name: "Sports",
      slug: "sports",
      icon: "⚽",
      color: "#3B82F6",
    },
    ticketTypes: [
      {
        id: "tt_09",
        name: "General Admission",
        description: "Lawn access with screen viewing",
        price: 1000,
        quantity: 5000,
        sold: 2300,
        maxPerOrder: 10,
      },
    ],
    artists: [],
  },
  {
    id: "evt_10",
    title: "Open Mic Night at The Driskill",
    slug: "open-mic-night-at-the-driskill",
    description: `Bring your talent and your courage! The Driskill Hotel hosts its beloved weekly Open Mic Night in the historic bar.

Singers, poets, comedians, storytellers -- all are welcome to sign up for a 5-minute slot. The sign-up sheet opens at 6:30 PM and slots fill fast, so arrive early!

No cover charge. Food and drinks available for purchase. A supportive and enthusiastic crowd awaits.`,
    shortDescription: "Free weekly open mic night for singers, poets, comics, and more.",
    startDate: futureDate(1, 19, 0),
    endDate: futureDate(1, 22, 0),
    doorsOpen: futureDate(1, 18, 30),
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: null,
    maxPrice: null,
    isFree: true,
    status: "published",
    isFeatured: false,
    tags: ["open-mic", "free", "community", "music", "poetry"],
    externalSource: null,
    externalUrl: null,
    venue: {
      id: "ven_10",
      name: "The Driskill Hotel",
      slug: "the-driskill-hotel",
      address: "604 Brazos St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      latitude: 30.2673,
      longitude: -97.7413,
    },
    category: {
      id: "cat_08",
      name: "Community",
      slug: "community",
      icon: "🤝",
      color: "#06B6D4",
    },
    ticketTypes: [],
    artists: [],
  },
  {
    id: "evt_11",
    title: "Rooftop Sunset Yoga & Sound Bath",
    slug: "rooftop-sunset-yoga-sound-bath",
    description: `Unwind and reconnect with this magical rooftop yoga experience. As the sun sets over the Austin skyline, certified instructor Lena Park guides you through a gentle vinyasa flow, followed by a deeply restorative sound bath featuring crystal singing bowls, chimes, and gong.

Mats and props provided. Bring a water bottle and wear comfortable clothing. Light refreshments served afterward.

This event sells out quickly -- secure your spot early!`,
    shortDescription: "Sunset yoga and sound bath on a rooftop with stunning skyline views.",
    startDate: futureDate(8, 18, 30),
    endDate: futureDate(8, 20, 30),
    doorsOpen: futureDate(8, 18, 0),
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: 3500,
    maxPrice: 3500,
    isFree: false,
    status: "published",
    isFeatured: false,
    tags: ["yoga", "wellness", "outdoor", "sunset", "sound-bath"],
    externalSource: null,
    externalUrl: null,
    venue: {
      id: "ven_11",
      name: "The LINE Hotel Rooftop",
      slug: "the-line-hotel-rooftop",
      address: "111 E Cesar Chavez St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      latitude: 30.2594,
      longitude: -97.7426,
    },
    category: {
      id: "cat_08",
      name: "Community",
      slug: "community",
      icon: "🤝",
      color: "#06B6D4",
    },
    ticketTypes: [
      {
        id: "tt_10",
        name: "Yoga + Sound Bath",
        description: "Mat and props included",
        price: 3500,
        quantity: 40,
        sold: 28,
        maxPerOrder: 2,
      },
    ],
    artists: [],
  },
  {
    id: "evt_12",
    title: "Retro Arcade Tournament Night",
    slug: "retro-arcade-tournament-night",
    description: `Calling all gamers! Cidercade Austin hosts a retro arcade tournament night featuring head-to-head competitions on classic cabinets: Street Fighter II, Pac-Man, Galaga, and more.

Registration opens at 6 PM. Tournaments start at 7 PM. Prizes for top 3 in each game include gift cards, exclusive merch, and bragging rights.

Entry includes unlimited play on all 200+ arcade games for the evening. Hard cider, craft beer, and non-alcoholic options available.`,
    shortDescription: "Compete in classic arcade tournaments with prizes and unlimited play.",
    startDate: futureDate(9, 18, 0),
    endDate: futureDate(9, 23, 0),
    doorsOpen: futureDate(9, 18, 0),
    imageUrl: null,
    thumbnailUrl: null,
    minPrice: 1200,
    maxPrice: 1200,
    isFree: false,
    status: "published",
    isFeatured: false,
    tags: ["gaming", "retro", "tournament", "nightlife", "competition"],
    externalSource: null,
    externalUrl: null,
    venue: {
      id: "ven_12",
      name: "Cidercade Austin",
      slug: "cidercade-austin",
      address: "979 Springdale Rd #130",
      city: "Austin",
      state: "TX",
      zipCode: "78702",
      latitude: 30.2604,
      longitude: -97.7050,
    },
    category: {
      id: "cat_06",
      name: "Nightlife",
      slug: "nightlife",
      icon: "🌙",
      color: "#EC4899",
    },
    ticketTypes: [
      {
        id: "tt_11",
        name: "Tournament Entry",
        description: "Includes unlimited play all night",
        price: 1200,
        quantity: 100,
        sold: 45,
        maxPerOrder: 4,
      },
    ],
    artists: [],
  },
];

// ---- Public API ----

export function getMockEvent(slug: string): MockEventDetail | null {
  return MOCK_EVENTS.find((e) => e.slug === slug) ?? null;
}

export function getMockSimilarEvents(
  currentSlug: string,
  limit: number = 4
): EventCardEvent[] {
  const current = MOCK_EVENTS.find((e) => e.slug === currentSlug);
  if (!current) return [];

  // Prefer same category, then just other events
  const sameCat = MOCK_EVENTS.filter(
    (e) => e.slug !== currentSlug && e.category.slug === current.category.slug
  );
  const others = MOCK_EVENTS.filter(
    (e) => e.slug !== currentSlug && e.category.slug !== current.category.slug
  );

  const pool = [...sameCat, ...others].slice(0, limit);

  return pool.map(toCardEvent);
}

export interface SearchFilters {
  q?: string;
  category?: string;
  date?: string;
  distance?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
}

export function getMockSearchResults(filters: SearchFilters): {
  events: EventCardEvent[];
  total: number;
  page: number;
  pageSize: number;
} {
  let filtered = [...MOCK_EVENTS];

  // Filter by query
  if (filters.q) {
    const q = filters.q.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.venue.name.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Filter by category
  if (filters.category) {
    filtered = filtered.filter((e) => e.category.slug === filters.category);
  }

  // Filter by date
  if (filters.date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = addDays(today, 1);
    const dayOfWeek = today.getDay(); // 0=Sun

    switch (filters.date) {
      case "today":
        filtered = filtered.filter((e) => {
          const d = new Date(e.startDate);
          return d >= today && d < tomorrow;
        });
        break;
      case "tomorrow": {
        const dayAfter = addDays(tomorrow, 1);
        filtered = filtered.filter((e) => {
          const d = new Date(e.startDate);
          return d >= tomorrow && d < dayAfter;
        });
        break;
      }
      case "this-weekend": {
        const saturday =
          dayOfWeek <= 5
            ? addDays(today, 6 - dayOfWeek)
            : dayOfWeek === 6
              ? today
              : addDays(today, -1); // Sunday -> previous Saturday
        const monday = addDays(saturday, 2);
        filtered = filtered.filter((e) => {
          const d = new Date(e.startDate);
          return d >= saturday && d < monday;
        });
        break;
      }
      case "this-week": {
        const endOfWeek = addDays(today, 7 - dayOfWeek);
        filtered = filtered.filter((e) => {
          const d = new Date(e.startDate);
          return d >= today && d < endOfWeek;
        });
        break;
      }
      case "this-month": {
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          1
        );
        filtered = filtered.filter((e) => {
          const d = new Date(e.startDate);
          return d >= today && d < endOfMonth;
        });
        break;
      }
    }
  }

  // Filter by price
  if (filters.minPrice != null) {
    const minCents = filters.minPrice * 100;
    filtered = filtered.filter(
      (e) => e.isFree || (e.minPrice != null && e.minPrice >= minCents)
    );
  }
  if (filters.maxPrice != null) {
    const maxCents = filters.maxPrice * 100;
    filtered = filtered.filter(
      (e) =>
        e.isFree ||
        (e.maxPrice != null && e.maxPrice <= maxCents) ||
        (e.minPrice != null && e.minPrice <= maxCents)
    );
  }

  // Sort
  switch (filters.sort) {
    case "price":
      filtered.sort((a, b) => (a.minPrice ?? 0) - (b.minPrice ?? 0));
      break;
    case "distance":
      // Mock: just shuffle differently
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "date":
    default:
      filtered.sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
      break;
  }

  const page = filters.page ?? 1;
  const pageSize = 12;
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    events: paged.map(toCardEvent),
    total,
    page,
    pageSize,
  };
}

// ---- Internal helpers ----

function toCardEvent(e: MockEventDetail): EventCardEvent {
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    startDate: e.startDate,
    imageUrl: e.imageUrl,
    thumbnailUrl: e.thumbnailUrl,
    minPrice: e.minPrice,
    maxPrice: e.maxPrice,
    isFree: e.isFree,
    venue: {
      name: e.venue.name,
      city: e.venue.city,
      state: e.venue.state,
    },
    category: {
      name: e.category.name,
      icon: e.category.icon,
      slug: e.category.slug,
    },
    externalSource: e.externalSource,
    distance_km: Math.round(Math.random() * 20 + 1),
  };
}
