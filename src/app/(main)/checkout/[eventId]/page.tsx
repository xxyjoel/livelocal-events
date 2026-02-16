export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight">Checkout</h1>
      <p className="mt-2 text-muted-foreground">
        Completing purchase for event:{" "}
        <span className="font-mono font-medium text-foreground">{eventId}</span>
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Ticket Selection */}
        <section className="rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Ticket Selection</h2>
          <div className="mt-4 space-y-4">
            {["General Admission", "VIP"].map((type) => (
              <div
                key={type}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{type}</p>
                  <p className="text-sm text-muted-foreground">
                    Price placeholder
                  </p>
                </div>
                <div className="h-8 w-24 rounded-md border bg-muted/50" />
              </div>
            ))}
          </div>
        </section>

        {/* Payment Section */}
        <section className="rounded-xl border p-6">
          <h2 className="text-xl font-semibold">Payment</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            <p>Payment form placeholder</p>
            <p>Stripe integration will go here</p>
            <div className="h-10 w-full rounded-md border bg-muted/50" />
            <div className="h-10 w-full rounded-md border bg-muted/50" />
          </div>
          <div className="mt-6 h-10 w-full rounded-md bg-primary" />
        </section>
      </div>
    </div>
  );
}
