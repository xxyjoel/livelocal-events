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
      {/* Hero Section */}
      <section>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-3 h-10 w-64" />
      </section>

      {/* Featured Carousel Skeleton */}
      <section className="mt-10">
        <Skeleton className="h-7 w-48" />
        <div className="mt-4 flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-full sm:w-[calc(100%-2rem)] md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]"
            >
              <Skeleton className="aspect-[16/7] sm:aspect-[16/8] w-full rounded-xl" />
            </div>
          ))}
        </div>
      </section>

      {/* Category Pills Skeleton */}
      <section className="mt-10">
        <Skeleton className="h-7 w-48" />
        <div className="mt-4 flex flex-wrap gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </section>

      {/* Event Grid Skeleton */}
      <section className="mt-10">
        <Skeleton className="h-7 w-48" />
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
