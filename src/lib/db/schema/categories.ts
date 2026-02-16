import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { events } from "./events";

export const categories = pgTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  icon: text("icon"),
  color: text("color"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  events: many(events),
}));
