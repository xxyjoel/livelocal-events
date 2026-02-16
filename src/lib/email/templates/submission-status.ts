function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LiveLocal Events</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #18181b; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.025em;">LiveLocal Events</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #e4e4e7; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">This email was sent by LiveLocal Events</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
  <tr>
    <td style="background-color: #18181b; border-radius: 6px;">
      <a href="${href}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function submissionApprovedEmail(params: {
  eventTitle: string;
  artistName: string;
  eventUrl: string;
}): { subject: string; html: string } {
  const { eventTitle, artistName, eventUrl } = params;

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #18181b;">Your event has been approved!</h2>
    <p style="margin: 0 0 8px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
      Great news! Your submitted event has been reviewed and approved. It is now live on LiveLocal Events.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0; width: 100%;">
      <tr>
        <td style="padding: 16px; background-color: #f4f4f5; border-radius: 6px;">
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Event</p>
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">${escapeHtml(eventTitle)}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Artist</p>
          <p style="margin: 0; font-size: 15px; color: #3f3f46;">${escapeHtml(artistName)}</p>
        </td>
      </tr>
    </table>
    ${button("View Your Event", eventUrl)}
    <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.5;">
      Thank you for contributing to the local events community.
    </p>`;

  return {
    subject: `Your event "${eventTitle}" has been approved`,
    html: emailLayout(content),
  };
}

export function submissionRejectedEmail(params: {
  eventTitle: string;
  artistName: string;
  moderationNote?: string;
}): { subject: string; html: string } {
  const { eventTitle, artistName, moderationNote } = params;

  const noteSection = moderationNote
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0; width: 100%;">
        <tr>
          <td style="padding: 16px; background-color: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 6px 6px 0;">
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #991b1b;">Reason</p>
            <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.5;">${escapeHtml(moderationNote)}</p>
          </td>
        </tr>
      </table>`
    : "";

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #18181b;">Your event submission was not approved</h2>
    <p style="margin: 0 0 8px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
      Unfortunately, your submitted event did not meet our guidelines and could not be published.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0; width: 100%;">
      <tr>
        <td style="padding: 16px; background-color: #f4f4f5; border-radius: 6px;">
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Event</p>
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">${escapeHtml(eventTitle)}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Artist</p>
          <p style="margin: 0; font-size: 15px; color: #3f3f46;">${escapeHtml(artistName)}</p>
        </td>
      </tr>
    </table>
    ${noteSection}
    <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.5;">
      If you believe this was an error, please feel free to submit a new event with updated details.
    </p>`;

  return {
    subject: `Your event "${eventTitle}" was not approved`,
    html: emailLayout(content),
  };
}

export function submissionNeedsRevisionEmail(params: {
  eventTitle: string;
  artistName: string;
  moderationNote?: string;
  submitUrl: string;
}): { subject: string; html: string } {
  const { eventTitle, artistName, moderationNote, submitUrl } = params;

  const noteSection = moderationNote
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0; width: 100%;">
        <tr>
          <td style="padding: 16px; background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 6px 6px 0;">
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #92400e;">Feedback from our team</p>
            <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.5;">${escapeHtml(moderationNote)}</p>
          </td>
        </tr>
      </table>`
    : "";

  const content = `
    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #18181b;">Your event needs a few changes</h2>
    <p style="margin: 0 0 8px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
      Your submitted event has been reviewed, and our team has requested some changes before it can be published.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px 0; width: 100%;">
      <tr>
        <td style="padding: 16px; background-color: #f4f4f5; border-radius: 6px;">
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Event</p>
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">${escapeHtml(eventTitle)}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Artist</p>
          <p style="margin: 0; font-size: 15px; color: #3f3f46;">${escapeHtml(artistName)}</p>
        </td>
      </tr>
    </table>
    ${noteSection}
    ${button("Resubmit Your Event", submitUrl)}
    <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.5;">
      Please review the feedback above and resubmit your event with the requested changes.
    </p>`;

  return {
    subject: `Changes requested for your event "${eventTitle}"`,
    html: emailLayout(content),
  };
}
