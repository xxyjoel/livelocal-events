"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createVenueSchema,
  updateVenueSchema,
  type CreateVenueInput,
  type UpdateVenueInput,
} from "@/lib/validators/venues";
import {
  createVenue,
  updateVenue,
  deleteVenue,
} from "@/lib/db/queries/venues";

export async function createVenueAction(formData: FormData) {
  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    zipCode: formData.get("zipCode"),
    country: formData.get("country") || "US",
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    capacity: formData.get("capacity") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    website: formData.get("website") || undefined,
  };

  const data = createVenueSchema.parse(raw);

  await createVenue(data);

  revalidatePath("/admin/venues");
  redirect("/admin/venues");
}

export async function updateVenueAction(id: string, formData: FormData) {
  const raw: Record<string, unknown> = {
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    zipCode: formData.get("zipCode") || undefined,
    country: formData.get("country") || undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    capacity: formData.get("capacity") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    website: formData.get("website") || undefined,
  };

  // Remove undefined keys so partial validation works correctly
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined)
  );

  const data = updateVenueSchema.parse(cleaned);

  await updateVenue(id, data);

  revalidatePath("/admin/venues");
  redirect("/admin/venues");
}

export async function deleteVenueAction(id: string) {
  try {
    await deleteVenue(id);

    revalidatePath("/admin/venues");
    redirect("/admin/venues");
  } catch (error) {
    // redirect() throws a special Next.js error internally -- rethrow it
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return { error: "Failed to delete venue. It may have associated events." };
  }
}
