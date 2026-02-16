"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createEventSchema,
  updateEventSchema,
} from "@/lib/validators/events";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  updateEventSubmission,
} from "@/lib/db/queries/events";

export async function createEventAction(formData: FormData) {
  const raw: Record<string, unknown> = {
    title: formData.get("title"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    doorsOpen: formData.get("doorsOpen") || undefined,
    venueId: formData.get("venueId"),
    categoryId: formData.get("categoryId"),
    imageUrl: formData.get("imageUrl") || undefined,
    isFree: formData.get("isFree") === "true",
    tags: formData.getAll("tags").length > 0
      ? formData.getAll("tags").map(String)
      : [],
  };

  const data = createEventSchema.parse(raw);

  await createEvent(data);

  revalidatePath("/admin/events");
  revalidatePath("/");
  redirect("/admin/events");
}

export async function updateEventAction(id: string, formData: FormData) {
  const raw: Record<string, unknown> = {
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    shortDescription: formData.get("shortDescription") || undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    doorsOpen: formData.get("doorsOpen") || undefined,
    venueId: formData.get("venueId") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    isFree: formData.has("isFree") ? formData.get("isFree") === "true" : undefined,
    tags: formData.has("tags")
      ? formData.getAll("tags").map(String)
      : undefined,
  };

  // Remove undefined keys so partial validation works correctly
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined)
  );

  const data = updateEventSchema.parse(cleaned);

  await updateEvent(id, data);

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}/edit`);
  revalidatePath("/");
  redirect("/admin/events");
}

export async function deleteEventAction(id: string) {
  try {
    await deleteEvent(id);

    revalidatePath("/admin/events");
    revalidatePath("/");
    redirect("/admin/events");
  } catch (error) {
    // redirect() throws a special Next.js error internally -- rethrow it
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return { error: "Failed to delete event." };
  }
}

export async function publishEventAction(id: string) {
  try {
    await updateEventStatus(id, "published");

    revalidatePath("/admin/events");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Failed to publish event." };
  }
}

export async function cancelEventAction(id: string) {
  try {
    await updateEventStatus(id, "cancelled");

    revalidatePath("/admin/events");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Failed to cancel event." };
  }
}

export async function approveSubmissionAction(id: string) {
  try {
    await updateEventSubmission(id, {
      submissionStatus: "approved",
      status: "published",
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/admin/events");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Failed to approve submission." };
  }
}

export async function rejectSubmissionAction(id: string, note: string) {
  try {
    await updateEventSubmission(id, {
      submissionStatus: "rejected",
      moderationNote: note,
    });

    revalidatePath("/admin/submissions");
    revalidatePath("/admin/events");
    return { success: true };
  } catch {
    return { error: "Failed to reject submission." };
  }
}
