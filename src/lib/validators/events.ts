import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().max(300).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  doorsOpen: z.coerce.date().optional(),
  venueId: z.string().min(1, "Venue is required"),
  categoryId: z.string().min(1, "Category is required"),
  imageUrl: z.string().url().optional(),
  isFree: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const updateEventSchema = createEventSchema.partial();

export const searchEventsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  date: z.enum(["today", "tomorrow", "this-weekend", "this-week", "this-month"]).optional(),
  distance: z.coerce.number().min(1).max(100).default(25),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["date", "distance", "price"]).default("date"),
  page: z.coerce.number().min(1).default(1),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type SearchEventsInput = z.infer<typeof searchEventsSchema>;
