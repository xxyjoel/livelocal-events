import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { events } from "./events";

export const artists = pgTable("artists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  bio: text("bio"),
  imageUrl: text("image_url"),
  spotifyUrl: text("spotify_url"),
  instagramUrl: text("instagram_url"),
  website: text("website"),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const eventArtists = pgTable("event_artists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  artistId: text("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  isHeadliner: boolean("is_headliner").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// Relations
export const artistsRelations = relations(artists, ({ one, many }) => ({
  user: one(users, {
    fields: [artists.userId],
    references: [users.id],
  }),
  eventArtists: many(eventArtists),
}));

export const eventArtistsRelations = relations(eventArtists, ({ one }) => ({
  event: one(events, {
    fields: [eventArtists.eventId],
    references: [events.id],
  }),
  artist: one(artists, {
    fields: [eventArtists.artistId],
    references: [artists.id],
  }),
}));
