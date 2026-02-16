import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden gap-0 py-0">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="space-y-1">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Search Bar Skeleton */}
      <section className="mt-6">
        <Skeleton className="h-12 w-full rounded-lg" />
      </section>

      {/* Filter Pills Skeleton */}
      <section className="mt-6 rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-md" />
          ))}
        </div>
      </section>

      {/* Results Skeleton */}
      <section className="mt-8">
        <div className="mb-4">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
