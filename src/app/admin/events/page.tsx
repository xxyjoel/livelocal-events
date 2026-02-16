export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEventsWithRelations } from "@/lib/db/queries/events";
import {
  deleteEventAction,
  publishEventAction,
  unpublishEventAction,
} from "@/lib/actions/events";
import { formatEventDate } from "@/lib/utils";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";

const statusVariantMap: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  published: "default",
  cancelled: "destructive",
  soldout: "outline",
  completed: "outline",
};

export default async function AdminEventsPage() {
  const eventsWithRelations = await getEventsWithRelations();

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

      <div className="mt-8">
        {eventsWithRelations.length === 0 ? (
          <div className="rounded-xl border">
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
              <CalendarIcon className="size-10 opacity-50" />
              <div className="text-center">
                <p className="font-medium">No events yet</p>
                <p className="mt-1 text-sm">
                  Create your first event to get started.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/admin/events/new">
                  <PlusIcon className="size-4" />
                  Create Event
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsWithRelations.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.title}
                    </TableCell>
                    <TableCell>
                      {formatEventDate(event.startDate)}
                    </TableCell>
                    <TableCell>
                      {event.venue?.name ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      {event.category?.name ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusVariantMap[event.status] ?? "secondary"
                        }
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon-xs">
                          <Link
                            href={`/admin/events/${event.id}/edit`}
                            title="Edit event"
                          >
                            <PencilIcon className="size-3" />
                          </Link>
                        </Button>

                        {event.status === "published" ? (
                          <form
                            action={async () => {
                              "use server";
                              await unpublishEventAction(event.id);
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon-xs"
                              title="Unpublish event"
                            >
                              <EyeOffIcon className="size-3" />
                            </Button>
                          </form>
                        ) : (
                          <form
                            action={async () => {
                              "use server";
                              await publishEventAction(event.id);
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon-xs"
                              title="Publish event"
                            >
                              <EyeIcon className="size-3" />
                            </Button>
                          </form>
                        )}

                        <form
                          action={async () => {
                            "use server";
                            await deleteEventAction(event.id);
                          }}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-xs"
                            title="Delete event"
                          >
                            <Trash2Icon className="size-3 text-destructive" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
