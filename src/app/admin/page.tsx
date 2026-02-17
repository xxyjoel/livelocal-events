export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatsCards } from "@/components/admin/stats-cards";
import { CalendarIcon, InboxIcon, ArrowRightIcon } from "lucide-react";
import {
  getEventCount,
  getVenueCount,
  getPendingSubmissionCount,
  getTotalTicketsSold,
} from "@/lib/db/queries/admin";

export default async function AdminDashboardPage() {
  const [totalEvents, totalVenues, pendingSubmissions, ticketsSold] =
    await Promise.all([
      getEventCount(),
      getVenueCount(),
      getPendingSubmissionCount(),
      getTotalTicketsSold(),
    ]);

  const stats = { totalEvents, totalVenues, pendingSubmissions, ticketsSold };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Overview of your platform activity.
      </p>

      <div className="mt-8">
        <StatsCards stats={stats} />
      </div>

      <Separator className="my-8" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Recent Events</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/events">
                View all
                <ArrowRightIcon className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No recent events to display. Create your first event to get
              started.
            </div>
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <InboxIcon className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Recent Submissions</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/submissions">
                View all
                <ArrowRightIcon className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No pending submissions. Community submissions will appear here
              for review.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
