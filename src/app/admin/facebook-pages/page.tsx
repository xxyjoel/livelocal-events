export const dynamic = "force-dynamic";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, GlobeIcon } from "lucide-react";
import { getFacebookPages } from "@/lib/db/queries/facebook-pages";
import { FacebookPageActions } from "@/components/admin/facebook-page-actions";

// ---------------------------------------------------------------------------
// Status badge configuration
// ---------------------------------------------------------------------------

const statusVariantMap: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  paused: "secondary",
  failed: "destructive",
  pending_review: "outline",
};

const statusLabelMap: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  failed: "Failed",
  pending_review: "Pending Review",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminFacebookPagesPage() {
  const pages = await getFacebookPages();

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Facebook Pages
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage tracked Facebook pages for event discovery.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/facebook-pages/new">
            <PlusIcon className="size-4" />
            Add Page
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        {pages.length === 0 ? (
          <div className="rounded-xl border">
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
              <GlobeIcon className="size-10 opacity-50" />
              <div className="text-center">
                <p className="font-medium">No Facebook pages tracked</p>
                <p className="mt-1 text-sm">
                  Add a Facebook page to start discovering events.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/admin/facebook-pages/new">
                  <PlusIcon className="size-4" />
                  Add Page
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked Venue</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Events Found</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">
                      {page.pageName ?? "Unnamed"}
                    </TableCell>
                    <TableCell>
                      <a
                        href={page.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {page.pageUrl.length > 40
                          ? `${page.pageUrl.slice(0, 40)}...`
                          : page.pageUrl}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusVariantMap[page.status] ?? "secondary"
                        }
                      >
                        {statusLabelMap[page.status] ?? page.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {page.venue?.name ?? (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {page.lastSyncAt
                        ? new Date(page.lastSyncAt).toLocaleDateString()
                        : (
                            <span className="text-muted-foreground">
                              Never
                            </span>
                          )}
                    </TableCell>
                    <TableCell>{page.eventsFound}</TableCell>
                    <TableCell className="text-right">
                      <FacebookPageActions
                        pageId={page.id}
                        currentStatus={page.status}
                      />
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
