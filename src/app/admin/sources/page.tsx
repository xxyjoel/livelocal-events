export const dynamic = "force-dynamic";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TicketIcon,
  TagIcon,
  MapPinIcon,
  GlobeIcon,
  RefreshCwIcon,
} from "lucide-react";
import { getRecentSyncLogs, getLastSyncPerSource } from "@/lib/db/queries/sync-logs";
import { SyncNowButton } from "@/components/admin/sync-now-button";
import { LinkHealthCheck } from "@/components/admin/link-health-check";

// ---------------------------------------------------------------------------
// Source configuration
// ---------------------------------------------------------------------------

const sourceConfig: Record<
  string,
  { label: string; icon: React.ElementType; description: string }
> = {
  ticketmaster: {
    label: "Ticketmaster",
    icon: TicketIcon,
    description: "Discovery API v2 event sync",
  },
  seatgeek: {
    label: "SeatGeek",
    icon: TagIcon,
    description: "SeatGeek event and venue sync",
  },
  google_places: {
    label: "Google Places",
    icon: MapPinIcon,
    description: "Venue discovery via Places API",
  },
  facebook: {
    label: "Facebook",
    icon: GlobeIcon,
    description: "Facebook page event scraping",
  },
};

const statusVariantMap: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  success: "default",
  partial: "outline",
  failed: "destructive",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number | null | undefined) {
  if (ms == null) return "N/A";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimeAgo(dateStr: string | null | undefined) {
  if (!dateStr) return "Never";

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminSourcesPage() {
  const [lastSyncPerSource, recentLogs] = await Promise.all([
    getLastSyncPerSource(),
    getRecentSyncLogs(20),
  ]);

  // Build a lookup map from source name to its last sync data
  const lastSyncMap = new Map(
    lastSyncPerSource.map((row) => [row.source, row])
  );

  const sourceKeys = Object.keys(sourceConfig);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Event Sources
        </h1>
        <p className="mt-2 text-muted-foreground">
          Monitor and manage event data sources. Trigger manual syncs or review
          recent sync history.
        </p>
      </div>

      {/* Source cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sourceKeys.map((key) => {
          const config = sourceConfig[key];
          const lastSync = lastSyncMap.get(key);
          const Icon = config.icon;

          return (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{config.label}</CardTitle>
                    <CardDescription className="text-xs">
                      {config.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last sync</span>
                  <span className="font-medium">
                    {formatTimeAgo(lastSync?.started_at)}
                  </span>
                </div>
                {lastSync && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        variant={
                          statusVariantMap[lastSync.status] ?? "secondary"
                        }
                      >
                        {lastSync.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Events</span>
                      <span className="font-medium">
                        +{lastSync.events_created} / ~{lastSync.events_updated}
                      </span>
                    </div>
                  </>
                )}
                <SyncNowButton source={key} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Link health check */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">
          External Link Health
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify that external source URLs on events are still reachable.
        </p>
        <div className="mt-4">
          <LinkHealthCheck />
        </div>
      </div>

      {/* Recent sync history */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          Recent Sync History
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Last 20 sync operations across all sources.
        </p>

        <div className="mt-4">
          {recentLogs.length === 0 ? (
            <div className="rounded-xl border">
              <div className="flex h-48 flex-col items-center justify-center gap-4 text-muted-foreground">
                <RefreshCwIcon className="size-10 opacity-50" />
                <div className="text-center">
                  <p className="font-medium">No sync history yet</p>
                  <p className="mt-1 text-sm">
                    Trigger a sync to see results here.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Events Created</TableHead>
                    <TableHead>Events Updated</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log) => {
                    const config = sourceConfig[log.source];
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {config?.label ?? log.source}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              statusVariantMap[log.status] ?? "secondary"
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.eventsCreated}</TableCell>
                        <TableCell>{log.eventsUpdated}</TableCell>
                        <TableCell>
                          {formatDuration(log.durationMs)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.startedAt
                            ? new Date(log.startedAt).toLocaleString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
