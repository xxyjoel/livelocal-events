import { resend, EMAIL_FROM } from "./index";
import {
  submissionApprovedEmail,
  submissionRejectedEmail,
  submissionNeedsRevisionEmail,
} from "./templates/submission-status";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://livelocal.events";

export async function sendSubmissionNotification(params: {
  to: string;
  eventTitle: string;
  artistName: string;
  status: "approved" | "rejected" | "needs_revision";
  moderationNote?: string;
  eventSlug?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, eventTitle, artistName, status, moderationNote, eventSlug } =
    params;

  try {
    let email: { subject: string; html: string };

    switch (status) {
      case "approved": {
        const eventUrl = eventSlug
          ? `${BASE_URL}/events/${eventSlug}`
          : BASE_URL;
        email = submissionApprovedEmail({ eventTitle, artistName, eventUrl });
        break;
      }
      case "rejected": {
        email = submissionRejectedEmail({
          eventTitle,
          artistName,
          moderationNote,
        });
        break;
      }
      case "needs_revision": {
        const submitUrl = `${BASE_URL}/submit`;
        email = submissionNeedsRevisionEmail({
          eventTitle,
          artistName,
          moderationNote,
          submitUrl,
        });
        break;
      }
    }

    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: email.subject,
      html: email.html,
    });

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email error";
    console.error(
      `Failed to send submission notification email to ${to}:`,
      message
    );
    return { success: false, error: message };
  }
}
