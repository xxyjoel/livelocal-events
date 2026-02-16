import { getVenuesForSelect } from "@/lib/db/queries/venues";
import { getCategoriesForSelect } from "@/lib/db/queries/categories";
import { SubmissionForm } from "@/components/submissions/submission-form";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const [venues, categories] = await Promise.all([
    getVenuesForSelect(),
    getCategoriesForSelect(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight">Submit Your Event</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Are you a band or artist? Submit your event to be featured on LiveLocal.
      </p>

      <section className="mt-8 rounded-xl border p-6">
        <SubmissionForm venues={venues} categories={categories} />
        <p className="mt-4 text-sm text-muted-foreground">
          Submissions will be reviewed by our team before being published.
        </p>
      </section>
    </div>
  );
}
