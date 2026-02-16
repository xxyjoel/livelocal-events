import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface IpApiResponse {
  ip: string;
  city: string;
  region: string;
  region_code: string;
  country: string;
  country_name: string;
  latitude: number;
  longitude: number;
  // ipapi.co returns many more fields; we only use these
}

/**
 * GET /api/geolocation
 *
 * Server-side proxy for IP geolocation via ipapi.co.
 * This avoids CORS issues and keeps the external API call on the server.
 * Returns { lat, lng, city, state } or an error with a 502 status.
 */
export async function GET() {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      headers: {
        Accept: "application/json",
        "User-Agent": "livelocal.events/1.0",
      },
      // No caching — every request gets fresh IP-based location
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(
        "[Geolocation API] ipapi.co responded with status %d",
        res.status
      );
      return NextResponse.json(
        { error: "IP geolocation service unavailable" },
        { status: 502 }
      );
    }

    const data: IpApiResponse = await res.json();

    return NextResponse.json({
      lat: data.latitude,
      lng: data.longitude,
      city: data.city,
      state: data.region_code || data.region || undefined,
    });
  } catch (err) {
    console.error("[Geolocation API] Failed to fetch IP geolocation:", err);
    return NextResponse.json(
      { error: "Failed to determine location from IP" },
      { status: 502 }
    );
  }
}
