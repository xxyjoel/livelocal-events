export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { updateEventAction } from "@/lib/actions/events";
import { getEventById } from "@/lib/db/queries/events";
import { getVenuesForSelect } from "@/lib/db/queries/venues";
import { getCategoriesForSelect } from "@/lib/db/queries/categories";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const [event, venues, categories] = await Promise.all([
    getEventById(eventId),
    getVenuesForSelect(),
    getCategoriesForSelect(),
  ]);

  if (!event) {
    notFound();
  }

  // Bind the event ID to the update action
  const boundUpdateAction = updateEventAction.bind(null, eventId);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
      <p className="mt-2 text-muted-foreground">
        Update the details for{" "}
        <span className="font-medium text-foreground">{event.title}</span>.
      </p>

      <section className="mt-8 rounded-xl border p-6">
        <EventForm
          venues={venues}
          categories={categories}
          defaultValues={{
            title: event.title,
            description: event.description ?? "",
            shortDescription: event.shortDescription ?? "",
            startDate: event.startDate,
            endDate: event.endDate ?? undefined,
            doorsOpen: event.doorsOpen ?? undefined,
            venueId: event.venueId,
            categoryId: event.categoryId,
            imageUrl: event.imageUrl ?? "",
            isFree: event.isFree,
            tags: event.tags ?? [],
          }}
          action={boundUpdateAction}
        />
      </section>
    </div>
  );
}
