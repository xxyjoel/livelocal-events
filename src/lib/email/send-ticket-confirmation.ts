import { resend, EMAIL_FROM } from "./index";
import { ticketConfirmationEmail } from "./templates/ticket-confirmation";
import { generateCalendarLink } from "./generate-calendar-link";
import { formatEventDate } from "@/lib/utils";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.AUTH_URL ||
  "https://livelocal.events";

export async function sendTicketConfirmation(params: {
  to: string;
  buyerName: string;
  eventTitle: string;
  eventDate: Date;
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
}): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    buyerName,
    eventTitle,
    eventDate,
    venueName,
    venueAddress,
    ticketDetails,
    totalAmount,
    serviceFee,
    orderId,
  } = params;

  try {
    const formattedDate = formatEventDate(eventDate);
    const ticketsUrl = `${BASE_URL}/profile/tickets`;

    const calendarUrl = generateCalendarLink({
      title: eventTitle,
      startDate: eventDate,
      location: `${venueName}, ${venueAddress}`,
      description: `Tickets purchased via LiveLocal Events. Order ID: ${orderId}`,
    });

    const email = ticketConfirmationEmail({
      buyerName,
      eventTitle,
      eventDate: formattedDate,
      venueName,
      venueAddress,
      ticketDetails,
      totalAmount,
      serviceFee,
      orderId,
      ticketsUrl,
      calendarUrl,
    });

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
      `Failed to send ticket confirmation email to ${to}:`,
      message
    );
    return { success: false, error: message };
  }
}
