import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { venues } from "./venues";
import { categories } from "./categories";
import { users } from "./users";

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
  "soldout",
  "completed",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending_review",
  "approved",
  "rejected",
  "needs_revision",
]);

export const events = pgTable(
  "events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    slug: text("slug").unique().notNull(),
    description: text("description"),
    shortDescription: text("short_description"),
    startDate: timestamp("start_date", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    endDate: timestamp("end_date", { mode: "date", withTimezone: true }),
    doorsOpen: timestamp("doors_open", { mode: "date", withTimezone: true }),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    organizerId: text("organizer_id").references(() => users.id),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    imageUrl: text("image_url"),
    thumbnailUrl: text("thumbnail_url"),
    minPrice: integer("min_price"),
    maxPrice: integer("max_price"),
    isFree: boolean("is_free").default(false).notNull(),
    status: eventStatusEnum("status").default("draft").notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    tags: text("tags").array(),
    submittedBy: text("submitted_by").references(() => users.id),
    submissionStatus: submissionStatusEnum("submission_status"),
    moderationNote: text("moderation_note"),
    externalSource: text("external_source"),
    externalId: text("external_id"),
    externalUrl: text("external_url"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("events_external_source_id_idx").on(
      table.externalSource,
      table.externalId
    ),
    index("events_status_idx").on(table.status),
    index("events_start_date_idx").on(table.startDate),
  ]
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  category: one(categories, {
    fields: [events.categoryId],
    references: [categories.id],
  }),
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
    relationName: "organizedEvents",
  }),
  submitter: one(users, {
    fields: [events.submittedBy],
    references: [users.id],
    relationName: "submittedEvents",
  }),
}));
