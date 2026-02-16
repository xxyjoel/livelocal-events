"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  state?: string;
}

export interface UseGeolocationReturn {
  location: GeoLocation;
  isLoading: boolean;
  error: string | null;
  requestBrowserLocation: () => void;
  setManualLocation: (location: GeoLocation) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COOKIE_NAME = "livelocal_location";
const COOKIE_MAX_AGE_DAYS = 365;

const DEFAULT_LOCATION: GeoLocation = {
  lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? "40.7128"),
  lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? "-74.006"),
  city: process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "New York",
  state: "NY",
};

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function getCookieLocation(): GeoLocation | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));

  if (!match) return null;

  try {
    const value = decodeURIComponent(match.split("=").slice(1).join("="));
    const parsed = JSON.parse(value);

    if (
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number" &&
      typeof parsed.city === "string"
    ) {
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        city: parsed.city,
        state: parsed.state ?? undefined,
      };
    }
  } catch {
    // Cookie is malformed — ignore it
  }

  return null;
}

function setCookieLocation(location: GeoLocation): void {
  if (typeof document === "undefined") return;

  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  const value = encodeURIComponent(
    JSON.stringify({
      lat: location.lat,
      lng: location.lng,
      city: location.city,
      ...(location.state ? { state: location.state } : {}),
    })
  );

  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Reverse geocode via browser coords -> city name
// We reuse the ipapi response format for consistency but call a different
// endpoint (nominatim) only if we already have lat/lng from the browser API.
// For simplicity we use a lightweight reverse lookup via our own API route.
// ---------------------------------------------------------------------------

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ city: string; state?: string }> {
  try {
    // Use OpenStreetMap Nominatim for reverse geocoding (free, no key needed)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: {
          "User-Agent": "livelocal.events/1.0",
        },
      }
    );

    if (!res.ok) throw new Error("Reverse geocode failed");

    const data = await res.json();
    const address = data.address ?? {};

    const city =
      address.city ??
      address.town ??
      address.village ??
      address.municipality ??
      "Unknown";
    const state = address.state ?? undefined;

    return { city, state };
  } catch {
    return { city: "Unknown" };
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track whether we've initialized from cookie / IP so we don't re-run
  const initialized = useRef(false);

  // -------------------------------------------------------------------------
  // 1. On mount: check cookie, then optionally try IP geolocation
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const cookieLocation = getCookieLocation();

    if (cookieLocation) {
      setLocation(cookieLocation);
      return;
    }

    // No cookie — try IP geolocation via our server-side API route
    setIsLoading(true);

    fetch("/api/geolocation")
      .then((res) => {
        if (!res.ok) throw new Error("IP geolocation request failed");
        return res.json();
      })
      .then((data: { lat: number; lng: number; city: string; state?: string }) => {
        const ipLocation: GeoLocation = {
          lat: data.lat,
          lng: data.lng,
          city: data.city,
          state: data.state,
        };
        setLocation(ipLocation);
        setCookieLocation(ipLocation);
      })
      .catch(() => {
        // Silently fall back to default — already set in useState
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // -------------------------------------------------------------------------
  // 2. Browser Geolocation API (opt-in, precise)
  // -------------------------------------------------------------------------
  const requestBrowserLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const { city, state } = await reverseGeocode(latitude, longitude);

          const browserLocation: GeoLocation = {
            lat: latitude,
            lng: longitude,
            city,
            state,
          };

          setLocation(browserLocation);
          setCookieLocation(browserLocation);
        } catch {
          // Even if reverse geocoding fails, store the coords
          const browserLocation: GeoLocation = {
            lat: latitude,
            lng: longitude,
            city: "Your Location",
          };
          setLocation(browserLocation);
          setCookieLocation(browserLocation);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000, // Cache for 10 minutes
      }
    );
  }, []);

  // -------------------------------------------------------------------------
  // 3. Manual location entry
  // -------------------------------------------------------------------------
  const setManualLocation = useCallback((manual: GeoLocation) => {
    setLocation(manual);
    setCookieLocation(manual);
    setError(null);
  }, []);

  return {
    location,
    isLoading,
    error,
    requestBrowserLocation,
    setManualLocation,
  };
}
