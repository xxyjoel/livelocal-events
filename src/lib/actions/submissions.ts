"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { events, artists, eventArtists, venues } from "@/lib/db/schema";
import { eventSubmissionSchema } from "@/lib/validators/submissions";
import { slugify } from "@/lib/utils";

export type SubmissionActionState = {
  success: boolean;
  error?: string;
};

export async function submitEventAction(
  _prevState: SubmissionActionState,
  formData: FormData
): Promise<SubmissionActionState> {
  const raw = Object.fromEntries(formData.entries());

  // Handle tags: split comma-separated string into array
  const tagsRaw = formData.get("tags");
  const tags =
    typeof tagsRaw === "string" && tagsRaw.trim()
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

  // Handle isFree checkbox
  const isFree = formData.get("isFree") === "on" || formData.get("isFree") === "true";

  const parsed = eventSubmissionSchema.safeParse({
    ...raw,
    tags,
    isFree,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validation failed",
    };
  }

  const data = parsed.data;

  try {
    // 1. Find or create artist
    const artistSlug = slugify(data.artistName);
    const existingArtist = await db
      .select()
      .from(artists)
      .where(eq(artists.slug, artistSlug))
      .limit(1);

    let artistId: string;

    if (existingArtist.length > 0) {
      artistId = existingArtist[0].id;
    } else {
      artistId = createId();
      await db.insert(artists).values({
        id: artistId,
        name: data.artistName,
        slug: artistSlug,
        bio: data.artistBio || null,
        spotifyUrl: data.spotifyUrl || null,
        instagramUrl: data.instagramUrl || null,
        website: data.artistWebsite || null,
      });
    }

    // 2. Fetch venue to get lat/lng
    const venue = await db
      .select({
        latitude: venues.latitude,
        longitude: venues.longitude,
      })
      .from(venues)
      .where(eq(venues.id, data.venueId))
      .limit(1);

    const venueData = venue[0] ?? null;

    // 3. Create event with draft status and pending_review submission status
    const eventId = createId();
    const eventSlug = slugify(data.title);

    await db.insert(events).values({
      id: eventId,
      title: data.title,
      slug: eventSlug,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate || null,
      venueId: data.venueId,
      categoryId: data.categoryId,
      imageUrl: data.imageUrl || null,
      isFree: data.isFree,
      tags: data.tags.length > 0 ? data.tags : null,
      status: "draft",
      submissionStatus: "pending_review",
      latitude: venueData?.latitude ?? null,
      longitude: venueData?.longitude ?? null,
    });

    // 4. Create event_artist join record
    await db.insert(eventArtists).values({
      id: createId(),
      eventId,
      artistId,
      isHeadliner: true,
      sortOrder: 0,
    });

    revalidatePath("/admin/submissions");

    return { success: true };
  } catch (e) {
    console.error("Submission error:", e);
    return {
      success: false,
      error: "Failed to submit event. Please try again.",
    };
  }
}
