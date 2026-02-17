"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkIcon } from "lucide-react";
import {
  checkExternalLinksAction,
  type LinkHealthResult,
} from "@/lib/actions/sources";

export function LinkHealthCheck() {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<LinkHealthResult | null>(null);

  async function handleCheck() {
    setIsPending(true);
    try {
      const data = await checkExternalLinksAction();
      setResult(data);
    } catch (error) {
      console.error("Link check failed:", error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleCheck}
        >
          <LinkIcon
            className={`size-3 ${isPending ? "animate-pulse" : ""}`}
          />
          {isPending ? "Checking..." : "Check Links"}
        </Button>

        {result && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {result.total} checked:
            </span>
            <Badge variant="default">{result.valid} valid</Badge>
            {result.broken > 0 && (
              <Badge variant="destructive">{result.broken} broken</Badge>
            )}
            {result.errors > 0 && (
              <Badge variant="outline">{result.errors} errors</Badge>
            )}
          </div>
        )}
      </div>

      {result && result.brokenLinks.length > 0 && (
        <div className="rounded-lg border p-4">
          <h4 className="mb-2 text-sm font-medium">Broken Links</h4>
          <ul className="space-y-1 text-sm">
            {result.brokenLinks.map((link) => (
              <li key={link.id} className="flex items-center gap-2">
                <span className="font-medium">{link.title}</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-muted-foreground underline"
                >
                  {link.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
