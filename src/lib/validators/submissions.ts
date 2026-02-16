import { z } from "zod";

export const eventSubmissionSchema = z.object({
  title: z.string().min(1, "Event title is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  venueId: z.string().optional(),
  newVenue: z
    .object({
      name: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zipCode: z.string().min(1),
    })
    .optional(),
  categoryId: z.string().min(1, "Category is required"),
  artistName: z.string().min(1, "Artist/band name is required"),
  artistBio: z.string().optional(),
  spotifyUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional(),
  isFree: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

export type EventSubmissionInput = z.infer<typeof eventSubmissionSchema>;
