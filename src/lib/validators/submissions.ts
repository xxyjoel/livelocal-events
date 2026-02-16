import { z } from "zod";

export const eventSubmissionSchema = z.object({
  // Artist info
  artistName: z.string().min(1, "Artist/band name is required").max(200),
  artistBio: z.string().max(1000).optional(),
  spotifyUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  artistWebsite: z.string().url().optional().or(z.literal("")),

  // Event info
  title: z.string().min(1, "Event title is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  venueId: z.string().min(1, "Venue is required"),
  categoryId: z.string().min(1, "Category is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isFree: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  contactEmail: z.string().email("Valid email is required"),
});

export type EventSubmissionInput = z.infer<typeof eventSubmissionSchema>;
