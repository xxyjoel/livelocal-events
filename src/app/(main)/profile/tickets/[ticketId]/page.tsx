export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Ticket Details</h1>
      <p className="mt-2 text-muted-foreground">
        Ticket ID:{" "}
        <span className="font-mono font-medium text-foreground">{ticketId}</span>
      </p>

      {/* QR Code Placeholder */}
      <section className="mt-8 w-full rounded-xl border p-8 text-center">
        <div className="mx-auto flex size-48 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 text-muted-foreground">
          QR Code Placeholder
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Present this QR code at the venue entrance
        </p>
      </section>

      {/* Ticket Info */}
      <section className="mt-6 w-full rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Event Information</h2>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>Event name placeholder</p>
          <p>Date and time placeholder</p>
          <p>Venue placeholder</p>
          <p>Ticket type placeholder</p>
          <p>Seat/section placeholder</p>
        </div>
      </section>
    </div>
  );
}
