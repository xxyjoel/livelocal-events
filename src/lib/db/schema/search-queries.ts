import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const searchQueries = pgTable(
  "search_queries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    query: text("query").notNull(),
    metro: text("metro").notNull(),
    category: text("category"),
    isActive: boolean("is_active").default(true).notNull(),
    lastRunAt: timestamp("last_run_at", {
      mode: "date",
      withTimezone: true,
    }),
    resultsCount: integer("results_count").default(0),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    unique("search_queries_query_metro_unique").on(table.query, table.metro),
    index("search_queries_metro_idx").on(table.metro),
    index("search_queries_is_active_idx").on(table.isActive),
  ]
);
