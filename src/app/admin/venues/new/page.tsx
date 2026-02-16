import { VenueForm } from "@/components/admin/venue-form";
import { createVenueAction } from "@/lib/actions/venues";

export default async function NewVenuePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Create Venue</h1>
      <p className="mt-2 text-muted-foreground">
        Fill in the details to register a new venue.
      </p>

      <section className="mt-8 rounded-xl border p-6">
        <VenueForm action={createVenueAction} />
      </section>
    </div>
  );
}
