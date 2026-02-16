import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { events } from "./events";
import { users } from "./users";

export const ticketTypes = pgTable("ticket_types", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  sold: integer("sold").default(0).notNull(),
  maxPerOrder: integer("max_per_order").default(10).notNull(),
  salesStart: timestamp("sales_start", { mode: "date", withTimezone: true }),
  salesEnd: timestamp("sales_end", { mode: "date", withTimezone: true }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  status: orderStatusEnum("status").default("pending").notNull(),
  totalAmount: integer("total_amount").notNull(),
  serviceFee: integer("service_fee").default(0).notNull(),
  currency: text("currency").default("usd").notNull(),
  quantity: integer("quantity").notNull(),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const ticketStatusEnum = pgEnum("ticket_status", [
  "valid",
  "used",
  "cancelled",
  "refunded",
]);

export const tickets = pgTable("tickets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  ticketTypeId: text("ticket_type_id")
    .notNull()
    .references(() => ticketTypes.id),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  status: ticketStatusEnum("status").default("valid").notNull(),
  qrCode: text("qr_code").unique().notNull(),
  checkedInAt: timestamp("checked_in_at", {
    mode: "date",
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

// Relations
export const ticketTypesRelations = relations(ticketTypes, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTypes.eventId],
    references: [events.id],
  }),
  tickets: many(tickets),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [orders.eventId],
    references: [events.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  order: one(orders, {
    fields: [tickets.orderId],
    references: [orders.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [tickets.ticketTypeId],
    references: [ticketTypes.id],
  }),
  event: one(events, {
    fields: [tickets.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
}));
