"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { addFacebookPageAction } from "@/lib/actions/sources";

interface AddFacebookPageFormProps {
  venues: Array<{ id: string; name: string }>;
}

export function AddFacebookPageForm({ venues }: AddFacebookPageFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { success: boolean; error?: string }, formData: FormData) => {
      const result = await addFacebookPageAction(formData);
      // If we get here, the redirect didn't happen (i.e., there was an error)
      return result ?? { success: false, error: "Unknown error" };
    },
    { success: false }
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="pageUrl">Page URL *</Label>
        <Input
          id="pageUrl"
          name="pageUrl"
          type="url"
          placeholder="https://www.facebook.com/venue-page"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pageName">Page Name *</Label>
        <Input
          id="pageName"
          name="pageName"
          placeholder="Venue or promoter name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pageId">Facebook Page ID (optional)</Label>
        <Input
          id="pageId"
          name="pageId"
          placeholder="e.g. 123456789"
        />
        <p className="text-xs text-muted-foreground">
          The numeric Facebook Page ID. Leave blank to auto-detect.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venueId">Link to Venue (optional)</Label>
        <select
          id="venueId"
          name="venueId"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          defaultValue=""
        >
          <option value="">-- No venue --</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Optionally associate this Facebook page with an existing venue.
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2Icon className="size-4 animate-spin" />}
        Add Facebook Page
      </Button>
    </form>
  );
}
