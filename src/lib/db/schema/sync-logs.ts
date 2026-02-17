import { createId } from "@paralleldrive/cuid2";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const syncLogs = pgTable(
  "sync_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    source: text("source").notNull(), // ticketmaster, seatgeek, google_places, facebook
    metro: text("metro").notNull(), // e.g. "seattle"
    status: text("status").notNull(), // success, partial, failed
    eventsCreated: integer("events_created").default(0).notNull(),
    eventsUpdated: integer("events_updated").default(0).notNull(),
    venuesCreated: integer("venues_created").default(0).notNull(),
    errors: text("errors").array(),
    durationMs: integer("duration_ms"),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    completedAt: timestamp("completed_at", {
      mode: "date",
      withTimezone: true,
    }),
  },
  (table) => [
    index("sync_logs_source_idx").on(table.source),
    index("sync_logs_started_at_idx").on(table.startedAt),
  ]
);
