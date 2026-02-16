import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default async function AdminEventsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Events</h1>
          <p className="mt-2 text-muted-foreground">
            Create, edit, and manage events on the platform.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <PlusIcon className="size-4" />
            New Event
          </Link>
        </Button>
      </div>

      {/* Events table placeholder */}
      <div className="mt-8 rounded-xl border">
        <div className="flex items-center justify-between border-b px-6 py-3">
          <p className="text-sm font-medium text-muted-foreground">
            Event list will appear here
          </p>
        </div>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          No events yet. Create your first event to get started.
        </div>
      </div>
    </div>
  );
}
