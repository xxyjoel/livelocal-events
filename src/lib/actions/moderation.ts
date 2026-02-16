"use server";

import { revalidatePath } from "next/cache";
import { updateEventSubmission } from "@/lib/db/queries/events";

export type ModerationActionState = {
  success: boolean;
  error?: string;
};

/**
 * Approve a submission: set submissionStatus to "approved" and status to "published".
 */
export async function approveSubmissionAction(
  eventId: string
): Promise<ModerationActionState> {
  try {
    await updateEventSubmission(eventId, {
      submissionStatus: "approved",
      status: "published",
    });
  } catch (e) {
    return { success: false, error: "Failed to approve submission." };
  }

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/events");
  revalidatePath("/");
  return { success: true };
}

/**
 * Reject a submission with a moderation note.
 */
export async function rejectSubmissionAction(
  eventId: string,
  formData: FormData
): Promise<ModerationActionState> {
  const moderationNote = formData.get("moderationNote") as string | null;

  if (!moderationNote?.trim()) {
    return {
      success: false,
      error: "A moderation note is required when rejecting a submission.",
    };
  }

  try {
    await updateEventSubmission(eventId, {
      submissionStatus: "rejected",
      moderationNote: moderationNote.trim(),
    });
  } catch (e) {
    return { success: false, error: "Failed to reject submission." };
  }

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/events");
  return { success: true };
}

/**
 * Request changes on a submission with a moderation note.
 */
export async function requestChangesAction(
  eventId: string,
  formData: FormData
): Promise<ModerationActionState> {
  const moderationNote = formData.get("moderationNote") as string | null;

  if (!moderationNote?.trim()) {
    return {
      success: false,
      error: "A moderation note is required when requesting changes.",
    };
  }

  try {
    await updateEventSubmission(eventId, {
      submissionStatus: "needs_revision",
      moderationNote: moderationNote.trim(),
    });
  } catch (e) {
    return { success: false, error: "Failed to request changes." };
  }

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/events");
  return { success: true };
}
