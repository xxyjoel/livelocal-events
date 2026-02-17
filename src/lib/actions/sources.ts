"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isNotNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { runEventSync, runVenueDiscovery } from "@/lib/sync/scheduler";
import {
  createFacebookPage,
  updateFacebookPage,
  deleteFacebookPage,
} from "@/lib/db/queries/facebook-pages";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const session = await auth();
  // @ts-expect-error - role exists on our user table
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Trigger a sync for a specific source.
 * Supported sources: ticketmaster, seatgeek, google_places, facebook, all
 */
export async function triggerSyncAction(source: string) {
  await requireAdmin();

  try {
    if (source === "google_places") {
      await runVenueDiscovery();
    } else {
      // For ticketmaster, seatgeek, facebook, or "all" — run the event sync
      // The scheduler handles which sources are available based on env vars
      await runEventSync();
    }
  } catch (error) {
    console.error(`[triggerSyncAction] Failed to sync ${source}:`, error);
    return {
      success: false,
      error: `Failed to trigger sync for ${source}.`,
    };
  }

  revalidatePath("/admin/sources");
  return { success: true };
}

/**
 * Add a new Facebook page entry from form data.
 */
export async function addFacebookPageAction(formData: FormData) {
  await requireAdmin();

  const pageUrl = formData.get("pageUrl") as string;
  const pageName = formData.get("pageName") as string;
  const pageId = formData.get("pageId") as string | null;
  const venueId = formData.get("venueId") as string | null;

  if (!pageUrl || !pageName) {
    return { success: false, error: "Page URL and Page Name are required." };
  }

  try {
    await createFacebookPage({
      pageUrl,
      pageName,
      pageId: pageId || null,
      venueId: venueId || null,
      source: "admin_added",
      status: "pending_review",
    });
  } catch (error) {
    console.error("[addFacebookPageAction] Failed:", error);
    return {
      success: false,
      error: "Failed to add Facebook page. Please try again.",
    };
  }

  revalidatePath("/admin/facebook-pages");
  redirect("/admin/facebook-pages");
}

/**
 * Update the status of a Facebook page.
 */
export async function updateFacebookPageStatusAction(
  id: string,
  status: string
) {
  await requireAdmin();

  const validStatuses = ["active", "paused", "failed", "pending_review"] as const;
  type ValidStatus = (typeof validStatuses)[number];

  if (!validStatuses.includes(status as ValidStatus)) {
    return { success: false, error: "Invalid status." };
  }

  try {
    await updateFacebookPage(id, { status: status as ValidStatus });
  } catch (error) {
    console.error("[updateFacebookPageStatusAction] Failed:", error);
    return { success: false, error: "Failed to update status." };
  }

  revalidatePath("/admin/facebook-pages");
  return { success: true };
}

/**
 * Delete a Facebook page entry.
 */
export async function deleteFacebookPageAction(id: string) {
  await requireAdmin();

  try {
    await deleteFacebookPage(id);
  } catch (error) {
    console.error("[deleteFacebookPageAction] Failed:", error);
    return { success: false, error: "Failed to delete Facebook page." };
  }

  revalidatePath("/admin/facebook-pages");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Link Health Check
// ---------------------------------------------------------------------------

export interface LinkHealthResult {
  total: number;
  valid: number;
  broken: number;
  errors: number;
  brokenLinks: { id: string; title: string; url: string }[];
}

/**
 * Check the health of external URLs on published events.
 * Sends a HEAD request to each externalUrl and reports broken links.
 */
export async function checkExternalLinksAction(): Promise<LinkHealthResult> {
  await requireAdmin();

  const externalEvents = await db
    .select({
      id: events.id,
      title: events.title,
      externalUrl: events.externalUrl,
    })
    .from(events)
    .where(isNotNull(events.externalUrl));

  const result: LinkHealthResult = {
    total: externalEvents.length,
    valid: 0,
    broken: 0,
    errors: 0,
    brokenLinks: [],
  };

  for (const event of externalEvents) {
    const url = event.externalUrl!;
    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok || response.status === 405 || response.status === 301 || response.status === 302) {
        result.valid++;
      } else {
        result.broken++;
        result.brokenLinks.push({ id: event.id, title: event.title, url });
      }
    } catch {
      result.errors++;
    }

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 100));
  }

  revalidatePath("/admin/sources");
  return result;
}
