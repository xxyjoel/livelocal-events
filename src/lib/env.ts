import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),
    AUTH_URL: z.string().url().optional(),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    UPLOADTHING_SECRET: z.string().min(1),
    UPLOADTHING_APP_ID: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    TICKETMASTER_API_KEY: z.string().optional(),
    SEATGEEK_CLIENT_ID: z.string().optional(),
    GOOGLE_PLACES_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_DEFAULT_LAT: z.coerce.number().default(40.7128),
    NEXT_PUBLIC_DEFAULT_LNG: z.coerce.number().default(-74.006),
    NEXT_PUBLIC_DEFAULT_CITY: z.string().default("New York"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
    UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY,
    SEATGEEK_CLIENT_ID: process.env.SEATGEEK_CLIENT_ID,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_DEFAULT_LAT: process.env.NEXT_PUBLIC_DEFAULT_LAT,
    NEXT_PUBLIC_DEFAULT_LNG: process.env.NEXT_PUBLIC_DEFAULT_LNG,
    NEXT_PUBLIC_DEFAULT_CITY: process.env.NEXT_PUBLIC_DEFAULT_CITY,
  },
  // Skip validation during build to allow building without all env vars
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
