"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import { triggerSyncAction } from "@/lib/actions/sources";

interface SyncNowButtonProps {
  source: string;
}

export function SyncNowButton({ source }: SyncNowButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleSync() {
    setIsPending(true);
    try {
      await triggerSyncAction(source);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleSync}
    >
      <RefreshCwIcon
        className={`size-3 ${isPending ? "animate-spin" : ""}`}
      />
      {isPending ? "Syncing..." : "Sync Now"}
    </Button>
  );
}
