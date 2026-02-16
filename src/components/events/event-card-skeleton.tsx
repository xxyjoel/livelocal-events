import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden gap-0 py-0">
      {/* Image area skeleton - 16:9 aspect ratio */}
      <Skeleton className="aspect-video w-full rounded-none" />

      {/* Content area skeleton */}
      <div className="flex flex-col gap-2 p-4">
        {/* Date skeleton */}
        <Skeleton className="h-4 w-32" />

        {/* Title skeleton */}
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />

        {/* Venue skeleton */}
        <Skeleton className="h-4 w-48" />

        {/* Price skeleton */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </Card>
  );
}
