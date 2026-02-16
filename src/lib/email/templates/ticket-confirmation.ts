import { formatPrice } from "@/lib/utils";

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

export function ticketConfirmationEmail(params: {
  buyerName: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  venueAddress: string;
  ticketDetails: Array<{
    typeName: string;
    quantity: number;
    pricePerTicket: number;
  }>;
  totalAmount: number;
  serviceFee: number;
  orderId: string;
  ticketsUrl: string;
  calendarUrl?: string;
}): { subject: string; html: string } {
  const {
    buyerName,
    eventTitle,
    eventDate,
    venueName,
    venueAddress,
    ticketDetails,
    totalAmount,
    serviceFee,
    orderId,
    ticketsUrl,
    calendarUrl,
  } = params;

  const ticketRows = ticketDetails
    .map((ticket) => {
      const subtotal = ticket.quantity * ticket.pricePerTicket;
      return `<tr>
        <td style="padding: 8px 0; font-size: 14px; color: #3f3f46; border-bottom: 1px solid #f4f4f5;">${escapeHtml(ticket.typeName)}</td>
        <td style="padding: 8px 0; font-size: 14px; color: #3f3f46; text-align: center; border-bottom: 1px solid #f4f4f5;">${ticket.quantity}</td>
        <td style="padding: 8px 0; font-size: 14px; color: #3f3f46; text-align: right; border-bottom: 1px solid #f4f4f5;">${formatPrice(ticket.pricePerTicket)}</td>
        <td style="padding: 8px 0; font-size: 14px; color: #3f3f46; text-align: right; border-bottom: 1px solid #f4f4f5;">${formatPrice(subtotal)}</td>
      </tr>`;
    })
    .join("");

  const calendarSection = calendarUrl
    ? `<p style="margin: 0 0 24px 0; text-align: center;">
        <a href="${calendarUrl}" target="_blank" style="font-size: 14px; color: #18181b; text-decoration: underline;">Add to Google Calendar</a>
      </p>`
    : "";

  const content = `
    <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #18181b;">Your tickets are confirmed!</h2>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
      Hi ${escapeHtml(buyerName)}, thanks for your purchase. Here are your order details.
    </p>

    <!-- Event Details Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0; width: 100%;">
      <tr>
        <td style="padding: 16px; background-color: #f4f4f5; border-radius: 6px;">
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Event</p>
          <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #18181b;">${escapeHtml(eventTitle)}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Date &amp; Time</p>
          <p style="margin: 0 0 12px 0; font-size: 15px; color: #3f3f46;">${escapeHtml(eventDate)}</p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em;">Venue</p>
          <p style="margin: 0 0 4px 0; font-size: 15px; color: #3f3f46;">${escapeHtml(venueName)}</p>
          <p style="margin: 0; font-size: 14px; color: #71717a;">${escapeHtml(venueAddress)}</p>
        </td>
      </tr>
    </table>

    <!-- Ticket Breakdown Table -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 16px 0; width: 100%;">
      <tr>
        <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e4e4e7;">Ticket</td>
        <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; border-bottom: 2px solid #e4e4e7;">Qty</td>
        <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; border-bottom: 2px solid #e4e4e7;">Price</td>
        <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; border-bottom: 2px solid #e4e4e7;">Subtotal</td>
      </tr>
      ${ticketRows}
      <tr>
        <td colspan="3" style="padding: 8px 0; font-size: 14px; color: #71717a; text-align: right; border-bottom: 1px solid #f4f4f5;">Service fee</td>
        <td style="padding: 8px 0; font-size: 14px; color: #71717a; text-align: right; border-bottom: 1px solid #f4f4f5;">${formatPrice(serviceFee)}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding: 12px 0 8px 0; font-size: 15px; font-weight: 700; color: #18181b; text-align: right;">Total</td>
        <td style="padding: 12px 0 8px 0; font-size: 15px; font-weight: 700; color: #18181b; text-align: right;">${formatPrice(totalAmount)}</td>
      </tr>
    </table>

    <!-- Order ID -->
    <p style="margin: 0 0 24px 0; font-size: 13px; color: #a1a1aa;">
      Order ID: ${escapeHtml(orderId)}
    </p>

    <!-- CTA Button -->
    ${button("View Your Tickets", ticketsUrl)}

    <!-- Calendar Link -->
    ${calendarSection}

    <!-- QR Code Note -->
    <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.5;">
      Present the QR code on your ticket page at the venue entrance.
    </p>`;

  return {
    subject: `Your tickets for ${eventTitle} are confirmed`,
    html: emailLayout(content),
  };
}
