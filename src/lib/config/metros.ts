/**
 * Centralized metro configuration.
 *
 * All sync modules (Ticketmaster, SeatGeek, Google Places, Facebook)
 * pull their city/location lists from here instead of maintaining
 * separate hardcoded arrays.
 */

export interface MetroConfig {
  slug: string;
  name: string;
  displayName: string;
  stateCode: string;
  lat: number;
  lng: number;
  searchRadiusMi: number;
  searchRadiusMeters: number;
  enabled: boolean;
}

// --- Metro definitions -------------------------------------------------------

export const SEATTLE_METRO: MetroConfig = {
  slug: "seattle",
  name: "Seattle",
  displayName: "Seattle, WA",
  stateCode: "WA",
  lat: 47.6062,
  lng: -122.3321,
  searchRadiusMi: 30,
  searchRadiusMeters: 48280, // 30 mi ≈ 48280 m
  enabled: true,
};

// Keep inactive metros for future expansion
export const ALL_METROS: MetroConfig[] = [
  SEATTLE_METRO,
  {
    slug: "new-york",
    name: "New York",
    displayName: "New York, NY",
    stateCode: "NY",
    lat: 40.7128,
    lng: -74.006,
    searchRadiusMi: 25,
    searchRadiusMeters: 40234,
    enabled: false,
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    displayName: "Los Angeles, CA",
    stateCode: "CA",
    lat: 34.0522,
    lng: -118.2437,
    searchRadiusMi: 30,
    searchRadiusMeters: 48280,
    enabled: false,
  },
  {
    slug: "chicago",
    name: "Chicago",
    displayName: "Chicago, IL",
    stateCode: "IL",
    lat: 41.8781,
    lng: -87.6298,
    searchRadiusMi: 20,
    searchRadiusMeters: 32187,
    enabled: false,
  },
  {
    slug: "austin",
    name: "Austin",
    displayName: "Austin, TX",
    stateCode: "TX",
    lat: 30.2672,
    lng: -97.7431,
    searchRadiusMi: 15,
    searchRadiusMeters: 24140,
    enabled: false,
  },
  {
    slug: "nashville",
    name: "Nashville",
    displayName: "Nashville, TN",
    stateCode: "TN",
    lat: 36.1627,
    lng: -86.7816,
    searchRadiusMi: 15,
    searchRadiusMeters: 24140,
    enabled: false,
  },
];

/** Only metros currently enabled for sync. */
export const ACTIVE_METROS = ALL_METROS.filter((m) => m.enabled);

// --- Helper functions for each sync module -----------------------------------

/** For Ticketmaster: returns { city, stateCode } tuples. */
export function toTicketmasterCities(metros: MetroConfig[] = ACTIVE_METROS) {
  return metros.map((m) => ({ city: m.name, stateCode: m.stateCode }));
}

/** For SeatGeek: returns { lat, lon, range } tuples. */
export function toSeatGeekLocations(metros: MetroConfig[] = ACTIVE_METROS) {
  return metros.map((m) => ({
    lat: m.lat,
    lon: m.lng,
    range: `${m.searchRadiusMi}mi`,
  }));
}

/** For Google Places: returns { name, lat, lng, radiusMeters } tuples. */
export function toGooglePlacesMetros(metros: MetroConfig[] = ACTIVE_METROS) {
  return metros.map((m) => ({
    name: m.name,
    lat: m.lat,
    lng: m.lng,
    radiusMeters: m.searchRadiusMeters,
  }));
}
