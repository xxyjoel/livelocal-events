export default async function AdminSubmissionsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Submission Queue</h1>
      <p className="mt-2 text-muted-foreground">
        Review and approve event submissions from artists and promoters.
      </p>

      {/* Submissions list placeholder */}
      <div className="mt-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-start gap-4 rounded-xl border p-6"
          >
            <div className="size-16 shrink-0 rounded-lg bg-muted/50" />
            <div className="flex-1 space-y-1">
              <p className="font-medium">Submission Placeholder {i}</p>
              <p className="text-sm text-muted-foreground">
                Submitted by placeholder - Date placeholder
              </p>
              <p className="text-sm text-muted-foreground">
                Event description preview placeholder
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <div className="h-9 w-20 rounded-md bg-primary" />
              <div className="h-9 w-20 rounded-md border" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex h-32 items-center justify-center rounded-xl border text-muted-foreground">
        Full moderation queue with filtering and pagination coming soon
      </div>
    </div>
  );
}
