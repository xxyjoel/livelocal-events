import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const eventSourceTypeEnum = pgEnum("event_source_type", [
  "api",
  "scraper",
  "feed",
  "manual",
]);

export const eventSourcePlatformEnum = pgEnum("event_source_platform", [
  "ticketmaster",
  "seatgeek",
  "facebook",
  "instagram",
  "reddit",
  "twitter",
  "threads",
  "company_website",
  "other",
]);

export const eventSourceAuthMethodEnum = pgEnum("event_source_auth_method", [
  "api_key",
  "oauth2",
  "scraping",
  "rss",
  "none",
]);

export const eventSources = pgTable(
  "event_sources",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").unique().notNull(),
    slug: text("slug").unique().notNull(),
    type: eventSourceTypeEnum("type").notNull(),
    platform: eventSourcePlatformEnum("platform").notNull(),
    baseUrl: text("base_url"),
    apiDocsUrl: text("api_docs_url"),
    authMethod: eventSourceAuthMethodEnum("auth_method"),
    isActive: boolean("is_active").default(false).notNull(),
    syncFrequency: text("sync_frequency"),
    lastSyncAt: timestamp("last_sync_at", {
      mode: "date",
      withTimezone: true,
    }),
    lastSyncError: text("last_sync_error"),
    totalEventsSynced: integer("total_events_synced").default(0).notNull(),
    config: jsonb("config"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("event_sources_slug_idx").on(table.slug),
    index("event_sources_platform_idx").on(table.platform),
    index("event_sources_is_active_idx").on(table.isActive),
  ]
);
