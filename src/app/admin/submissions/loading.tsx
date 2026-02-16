import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-2 h-5 w-80" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="mt-8 rounded-xl border">
        {/* Table Header */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <div className="ml-auto">
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        {/* Table Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b px-4 py-3 last:border-b-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <div className="ml-auto flex gap-1">
                <Skeleton className="size-6 rounded-md" />
                <Skeleton className="size-6 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
