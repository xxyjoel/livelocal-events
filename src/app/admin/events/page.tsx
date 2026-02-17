export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminEvents } from "@/lib/db/queries/admin";
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
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
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

const STATUS_OPTIONS = ["all", "published", "draft", "cancelled", "soldout", "completed"];

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;

  const { events, total, totalPages } = await getAdminEvents({ q, status, page, limit: 50 });

  // Build URL helper for filter links
  function filterUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { q, status, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "1" && k === "page") p.set(k, v);
      else if (v && k !== "page") p.set(k, v);
    }
    const qs = p.toString();
    return `/admin/events${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Manage Events</h1>
          <p className="mt-2 text-muted-foreground">
            {total} event{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/events/new">
            <PlusIcon className="size-4" />
            New Event
          </Link>
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="relative flex-1" action="/admin/events" method="GET">
          {status && <input type="hidden" name="status" value={status} />}
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search events..."
            defaultValue={q}
            className="pl-9"
          />
        </form>
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_OPTIONS.map((s) => (
            <Button
              key={s}
              asChild
              variant={(status ?? "all") === s ? "default" : "outline"}
              size="sm"
            >
              <Link href={filterUrl({ status: s === "all" ? undefined : s, page: undefined })}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {events.length === 0 ? (
          <div className="rounded-xl border">
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
              <CalendarIcon className="size-10 opacity-50" />
              <div className="text-center">
                <p className="font-medium">
                  {q || status ? "No events match your filters" : "No events yet"}
                </p>
                <p className="mt-1 text-sm">
                  {q || status
                    ? "Try adjusting your search or filters."
                    : "Create your first event to get started."}
                </p>
              </div>
              {!q && !status && (
                <Button asChild size="sm">
                  <Link href="/admin/events/new">
                    <PlusIcon className="size-4" />
                    Create Event
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="max-w-[250px] truncate font-medium">
                      {event.title}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatEventDate(event.startDate)}
                    </TableCell>
                    <TableCell>
                      {event.venue?.name ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      {event.category?.name ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {event.externalSource ?? "manual"}
                      </span>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={page <= 1}
              >
                <Link
                  href={filterUrl({ page: String(page - 1) })}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <ChevronLeftIcon className="size-4" />
                  Previous
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
              >
                <Link
                  href={filterUrl({ page: String(page + 1) })}
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                >
                  Next
                  <ChevronRightIcon className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
