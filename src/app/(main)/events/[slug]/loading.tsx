import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <>
      {/* Hero Image Skeleton */}
      <section className="relative h-64 w-full overflow-hidden sm:h-80 md:h-96">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-3/4 sm:h-12" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Date & Time */}
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-5 w-32" />
            </div>

            <Skeleton className="h-px w-full" />

            {/* Description */}
            <section>
              <Skeleton className="h-7 w-44" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </section>

            <Skeleton className="h-px w-full" />

            {/* Venue */}
            <section>
              <Skeleton className="h-7 w-24" />
              <div className="mt-4 flex items-start gap-3">
                <Skeleton className="size-10 shrink-0 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Ticket Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Skeleton className="mx-auto h-8 w-32" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-px w-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
