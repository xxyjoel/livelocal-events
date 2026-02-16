"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createEventSchema, updateEventSchema } from "@/lib/validators/events";
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/db/queries/events";

export type EventActionState = {
  success: boolean;
  error?: string;
};

export async function createEventAction(
  _prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const raw = Object.fromEntries(formData.entries());

  // Handle tags: split comma-separated string into array
  const tagsRaw = formData.get("tags");
  const tags =
    typeof tagsRaw === "string" && tagsRaw.trim()
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  // Handle isFree checkbox
  const isFree = formData.get("isFree") === "on" || formData.get("isFree") === "true";

  const parsed = createEventSchema.safeParse({
    ...raw,
    tags,
    isFree,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    await createEvent(parsed.data);
  } catch (e) {
    return { success: false, error: "Failed to create event. Please try again." };
  }

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateEventAction(
  id: string,
  _prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const raw = Object.fromEntries(formData.entries());

  // Handle tags: split comma-separated string into array
  const tagsRaw = formData.get("tags");
  const tags =
    typeof tagsRaw === "string" && tagsRaw.trim()
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  // Handle isFree checkbox
  const isFree = formData.get("isFree") === "on" || formData.get("isFree") === "true";

  const parsed = updateEventSchema.safeParse({
    ...raw,
    tags,
    isFree,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  try {
    await updateEvent(id, parsed.data);
  } catch (e) {
    return { success: false, error: "Failed to update event. Please try again." };
  }

  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function deleteEventAction(id: string): Promise<EventActionState> {
  try {
    await deleteEvent(id);
  } catch (e) {
    return { success: false, error: "Failed to delete event." };
  }

  revalidatePath("/admin/events");
  return { success: true };
}

export async function publishEventAction(id: string): Promise<EventActionState> {
  try {
    await updateEvent(id, { status: "published" });
  } catch (e) {
    return { success: false, error: "Failed to publish event." };
  }

  revalidatePath("/admin/events");
  return { success: true };
}

export async function unpublishEventAction(id: string): Promise<EventActionState> {
  try {
    await updateEvent(id, { status: "draft" });
  } catch (e) {
    return { success: false, error: "Failed to unpublish event." };
  }

  revalidatePath("/admin/events");
  return { success: true };
}
