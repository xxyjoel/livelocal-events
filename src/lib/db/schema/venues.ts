import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { events } from "./events";

export const sourceEnum = pgEnum("venue_source", [
  "manual",
  "google_places",
  "ticketmaster",
  "seatgeek",
]);

// Note: We store lat/lng as regular columns since PostGIS geometry columns
// require raw SQL. The actual PostGIS POINT column + GiST index will be
// added via a custom SQL migration.
export const venues = pgTable("venues", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("US").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  capacity: integer("capacity"),
  imageUrl: text("image_url"),
  website: text("website"),
  googlePlaceId: text("google_place_id").unique(),
  googleRating: numeric("google_rating"),
  source: sourceEnum("source").default("manual").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const venuesRelations = relations(venues, ({ many }) => ({
  events: many(events),
}));
