import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
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
  "facebook",
]);

// Note: We store lat/lng as regular columns since PostGIS geometry columns
// require raw SQL. The actual PostGIS POINT column + GiST index will be
// added via a custom SQL migration.
export const venues = pgTable(
  "venues",
  {
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
    facebookPageId: text("facebook_page_id").unique(),
    facebookPageUrl: text("facebook_page_url"),
    phone: text("phone"),
    neighborhood: text("neighborhood"),
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
  },
  (table) => [
    index("venues_city_state_idx").on(table.city, table.state),
    index("venues_facebook_page_id_idx").on(table.facebookPageId),
  ]
);

export const venuesRelations = relations(venues, ({ many }) => ({
  events: many(events),
}));
