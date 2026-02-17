import { z } from "zod";

export const createVenueSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().default("US"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  capacity: z.coerce.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  facebookPageUrl: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  facebookPageId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
});

export const updateVenueSchema = createVenueSchema.partial();

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
