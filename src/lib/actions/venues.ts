"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createVenueSchema, updateVenueSchema } from "@/lib/validators/venues";
import {
  createVenue,
  updateVenue,
  deleteVenue,
} from "@/lib/db/queries/venues";

export type VenueActionState = {
  success: boolean;
  error?: string;
};

export async function createVenueAction(
  _prevState: VenueActionState,
  formData: FormData
): Promise<VenueActionState> {
  const raw = Object.fromEntries(formData.entries());

  const parsed = createVenueSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    await createVenue(parsed.data);
  } catch (e) {
    return { success: false, error: "Failed to create venue. Please try again." };
  }

  revalidatePath("/admin/venues");
  redirect("/admin/venues");
}

export async function updateVenueAction(
  id: string,
  _prevState: VenueActionState,
  formData: FormData
): Promise<VenueActionState> {
  const raw = Object.fromEntries(formData.entries());

  const parsed = updateVenueSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    await updateVenue(id, parsed.data);
  } catch (e) {
    return { success: false, error: "Failed to update venue. Please try again." };
  }

  revalidatePath("/admin/venues");
  redirect("/admin/venues");
}

export async function deleteVenueAction(id: string): Promise<VenueActionState> {
  try {
    await deleteVenue(id);
  } catch (e) {
    return { success: false, error: "Failed to delete venue." };
  }

  revalidatePath("/admin/venues");
  return { success: true };
}
