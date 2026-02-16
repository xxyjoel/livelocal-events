export const dynamic = "force-dynamic";

import { EventForm } from "@/components/admin/event-form";
import { createEventAction } from "@/lib/actions/events";
import { getVenuesForSelect } from "@/lib/db/queries/venues";
import { getCategoriesForSelect } from "@/lib/db/queries/categories";

export default async function NewEventPage() {
  const [venues, categories] = await Promise.all([
    getVenuesForSelect(),
    getCategoriesForSelect(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
      <p className="mt-2 text-muted-foreground">
        Fill in the details to create a new event.
      </p>

      <section className="mt-8 rounded-xl border p-6">
        <EventForm
          venues={venues}
          categories={categories}
          action={createEventAction}
        />
      </section>
    </div>
  );
}
