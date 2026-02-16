"use client";

import { useCallback, useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = document.title;

    // Use native share API on mobile if available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or not supported -- fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-1.5"
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          Share
        </>
      )}
    </Button>
  );
}
