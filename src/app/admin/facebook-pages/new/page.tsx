import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import { getVenuesForSelect } from "@/lib/db/queries/venues";
import { AddFacebookPageForm } from "@/components/admin/add-facebook-page-form";

export default async function NewFacebookPagePage() {
  const venues = await getVenuesForSelect();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/admin/facebook-pages">
            <ChevronLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Add Facebook Page
          </h1>
          <p className="mt-2 text-muted-foreground">
            Add a new Facebook page to track for event discovery.
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-xl border p-6">
        <AddFacebookPageForm venues={venues} />
      </section>
    </div>
  );
}
