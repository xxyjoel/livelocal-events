import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Table Skeleton */}
      <div className="mt-8 rounded-xl border">
        {/* Table Header */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
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
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="ml-auto flex gap-1">
                <Skeleton className="size-6 rounded-md" />
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
