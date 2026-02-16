import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Event Summary Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-9 w-80" />
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Ticket Selector Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-56" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary Skeleton */}
      <div className="mt-8 rounded-xl border p-6">
        <Skeleton className="h-6 w-36 mb-4" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="mt-6 h-11 w-full rounded-md" />
      </div>
    </div>
  );
}
