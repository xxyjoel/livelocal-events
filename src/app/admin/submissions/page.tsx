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
import { getSubmissions } from "@/lib/db/queries/events";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { formatEventDate } from "@/lib/utils";
import { InboxIcon } from "lucide-react";

const submissionStatusVariantMap: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending_review: "secondary",
  approved: "default",
  rejected: "destructive",
  needs_revision: "outline",
};

const submissionStatusLabelMap: Record<string, string> = {
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  needs_revision: "Needs Revision",
};

const filterTabs = [
  { label: "All", value: undefined },
  { label: "Pending", value: "pending_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Needs Revision", value: "needs_revision" },
] as const;

interface AdminSubmissionsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminSubmissionsPage({
  searchParams,
}: AdminSubmissionsPageProps) {
  const params = await searchParams;
  const currentStatus = params.status;
  const submissions = await getSubmissions(currentStatus);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Submission Queue</h1>
        <p className="mt-2 text-muted-foreground">
          Review and approve event submissions from artists and promoters.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
        {filterTabs.map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <Button
              key={tab.label}
              asChild
              variant={isActive ? "default" : "outline"}
              size="sm"
            >
              <Link
                href={
                  tab.value
                    ? `/admin/submissions?status=${tab.value}`
                    : "/admin/submissions"
                }
              >
                {tab.label}
              </Link>
            </Button>
          );
        })}
      </div>

      {/* Submissions table */}
      <div className="mt-8">
        {submissions.length === 0 ? (
          <div className="rounded-xl border">
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
              <InboxIcon className="size-10 opacity-50" />
              <div className="text-center">
                <p className="font-medium">No submissions found</p>
                <p className="mt-1 text-sm">
                  {currentStatus
                    ? `There are no submissions with status "${submissionStatusLabelMap[currentStatus] ?? currentStatus}".`
                    : "There are no event submissions to review yet."}
                </p>
              </div>
              {currentStatus && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/submissions">View all submissions</Link>
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
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {submission.title}
                    </TableCell>
                    <TableCell>
                      {submission.submitter?.name ?? "Anonymous"}
                    </TableCell>
                    <TableCell>
                      {formatEventDate(submission.startDate)}
                    </TableCell>
                    <TableCell>
                      {submission.venue?.name ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      {submission.category?.name ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          submissionStatusVariantMap[
                            submission.submissionStatus ?? ""
                          ] ?? "secondary"
                        }
                      >
                        {submissionStatusLabelMap[
                          submission.submissionStatus ?? ""
                        ] ?? submission.submissionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ModerationActions
                        eventId={submission.id}
                        currentStatus={submission.submissionStatus ?? ""}
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
