"use client";

import { Button } from "@/components/ui/button";
import { PauseIcon, PlayIcon, Trash2Icon } from "lucide-react";
import {
  updateFacebookPageStatusAction,
  deleteFacebookPageAction,
} from "@/lib/actions/sources";

interface FacebookPageActionsProps {
  pageId: string;
  currentStatus: string;
}

export function FacebookPageActions({
  pageId,
  currentStatus,
}: FacebookPageActionsProps) {
  const isPaused = currentStatus === "paused";

  return (
    <div className="flex items-center justify-end gap-1">
      <form
        action={async () => {
          await updateFacebookPageStatusAction(
            pageId,
            isPaused ? "active" : "paused"
          );
        }}
      >
        <Button
          type="submit"
          variant="ghost"
          size="icon-xs"
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <PlayIcon className="size-3" />
          ) : (
            <PauseIcon className="size-3" />
          )}
        </Button>
      </form>
      <form
        action={async () => {
          await deleteFacebookPageAction(pageId);
        }}
      >
        <Button
          type="submit"
          variant="ghost"
          size="icon-xs"
          title="Delete"
        >
          <Trash2Icon className="size-3 text-destructive" />
        </Button>
      </form>
    </div>
  );
}
