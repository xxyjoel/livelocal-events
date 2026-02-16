"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  approveSubmissionAction,
  rejectSubmissionAction,
  requestChangesAction,
  type ModerationActionState,
} from "@/lib/actions/moderation";
import { CheckIcon, XIcon, MessageSquareIcon } from "lucide-react";

interface ModerationActionsProps {
  eventId: string;
  currentStatus: string;
}

const initialState: ModerationActionState = {
  success: false,
};

export function ModerationActions({
  eventId,
  currentStatus,
}: ModerationActionsProps) {
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [changesOpen, setChangesOpen] = React.useState(false);

  // Approve action bound to the event ID
  const boundApprove = async () => {
    return approveSubmissionAction(eventId);
  };

  // Reject action bound to the event ID
  const boundReject = async (
    _prevState: ModerationActionState,
    formData: FormData
  ) => {
    const result = await rejectSubmissionAction(eventId, formData);
    if (result.success) {
      setRejectOpen(false);
    }
    return result;
  };

  // Request changes action bound to the event ID
  const boundRequestChanges = async (
    _prevState: ModerationActionState,
    formData: FormData
  ) => {
    const result = await requestChangesAction(eventId, formData);
    if (result.success) {
      setChangesOpen(false);
    }
    return result;
  };

  const [rejectState, rejectAction, rejectPending] = useActionState(
    boundReject,
    initialState
  );
  const [changesState, changesAction, changesPending] = useActionState(
    boundRequestChanges,
    initialState
  );

  const isAlreadyApproved = currentStatus === "approved";
  const isAlreadyRejected = currentStatus === "rejected";

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Approve — direct form submit */}
      <form
        action={async () => {
          await boundApprove();
        }}
      >
        <Button
          type="submit"
          variant="ghost"
          size="icon-xs"
          title="Approve submission"
          disabled={isAlreadyApproved}
          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
        >
          <CheckIcon className="size-3" />
        </Button>
      </form>

      {/* Reject — opens dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            title="Reject submission"
            disabled={isAlreadyRejected}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <XIcon className="size-3" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this submission. The submitter will
              be able to see this note.
            </DialogDescription>
          </DialogHeader>
          <form action={rejectAction}>
            <div className="space-y-4">
              <Textarea
                name="moderationNote"
                placeholder="Reason for rejection..."
                required
                rows={4}
              />
              {rejectState.error && (
                <p className="text-sm text-destructive">{rejectState.error}</p>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={rejectPending}
              >
                {rejectPending ? "Rejecting..." : "Reject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request Changes — opens dialog */}
      <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            title="Request changes"
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
          >
            <MessageSquareIcon className="size-3" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe the changes needed for this submission. The submitter will
              be able to see this note and revise their submission.
            </DialogDescription>
          </DialogHeader>
          <form action={changesAction}>
            <div className="space-y-4">
              <Textarea
                name="moderationNote"
                placeholder="Describe the changes needed..."
                required
                rows={4}
              />
              {changesState.error && (
                <p className="text-sm text-destructive">
                  {changesState.error}
                </p>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangesOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="secondary"
                disabled={changesPending}
              >
                {changesPending ? "Sending..." : "Request Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
