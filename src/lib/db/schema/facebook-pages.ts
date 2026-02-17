import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { venues } from "./venues";

export const facebookPageSourceEnum = pgEnum("facebook_page_source", [
  "auto_discovered",
  "admin_added",
  "venue_owner_linked",
]);

export const facebookPageStatusEnum = pgEnum("facebook_page_status", [
  "active",
  "paused",
  "failed",
  "pending_review",
]);

export const facebookPages = pgTable(
  "facebook_pages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    pageId: text("page_id").unique(),
    pageUrl: text("page_url").notNull(),
    pageName: text("page_name"),
    venueId: text("venue_id").references(() => venues.id),
    source: facebookPageSourceEnum("source")
      .default("admin_added")
      .notNull(),
    status: facebookPageStatusEnum("status")
      .default("pending_review")
      .notNull(),
    lastSyncAt: timestamp("last_sync_at", {
      mode: "date",
      withTimezone: true,
    }),
    lastSyncError: text("last_sync_error"),
    syncCount: integer("sync_count").default(0).notNull(),
    eventsFound: integer("events_found").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("facebook_pages_venue_id_idx").on(table.venueId),
    index("facebook_pages_status_idx").on(table.status),
  ]
);

export const facebookPagesRelations = relations(facebookPages, ({ one }) => ({
  venue: one(venues, {
    fields: [facebookPages.venueId],
    references: [venues.id],
  }),
}));
