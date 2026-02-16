import { z } from "zod";

export const ticketTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be non-negative"), // in dollars for form input
  quantity: z.coerce.number().int().min(1, "Must have at least 1 ticket"),
  maxPerOrder: z.coerce.number().int().min(1).max(50).default(10),
  salesStart: z.coerce.date().optional(),
  salesEnd: z.coerce.date().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export type TicketTypeInput = z.infer<typeof ticketTypeSchema>;
