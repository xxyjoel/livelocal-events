"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  eventSubmissionSchema,
  type EventSubmissionInput,
} from "@/lib/validators/submissions";
import { submitEventAction } from "@/lib/actions/submissions";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon, CheckCircle2Icon } from "lucide-react";

interface SubmissionFormProps {
  venues: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

function toDatetimeLocal(date: Date | string | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SubmissionForm({ venues, categories }: SubmissionFormProps) {
  const [state, formAction, isPending] = useActionState(submitEventAction, {
    success: false,
  });

  const form = useForm<EventSubmissionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(eventSubmissionSchema) as any,
    defaultValues: {
      artistName: "",
      artistBio: "",
      spotifyUrl: "",
      instagramUrl: "",
      artistWebsite: "",
      title: "",
      description: "",
      startDate: undefined as unknown as Date,
      endDate: undefined,
      venueId: "",
      categoryId: "",
      imageUrl: "",
      isFree: false,
      tags: [],
      contactEmail: "",
    },
  });

  if (state.success) {
    return (
      <div className="rounded-xl border bg-green-50 p-8 text-center dark:bg-green-950/20">
        <CheckCircle2Icon className="mx-auto size-12 text-green-600 dark:text-green-400" />
        <h2 className="mt-4 text-2xl font-semibold text-green-900 dark:text-green-100">
          Event Submitted!
        </h2>
        <p className="mt-2 text-green-700 dark:text-green-300">
          Your event has been submitted and is pending review! Our team will
          review it shortly and you&apos;ll receive a notification once
          it&apos;s approved.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        {state.error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {/* Artist Information Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Artist Information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us about the artist or band performing.
            </p>
          </div>

          <FormField
            control={form.control}
            name="artistName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Artist / Band Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. The Local Favorites"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="artistBio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about the artist or band..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="spotifyUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spotify URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://open.spotify.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagramUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://instagram.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="artistWebsite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Event Details Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Event Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Provide the details about your upcoming event.
            </p>
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Friday Night Live" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your event, what attendees can expect..."
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date & Time</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={
                        field.value ? toDatetimeLocal(field.value) : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? new Date(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date & Time (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={
                        field.value ? toDatetimeLocal(field.value) : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? new Date(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="venueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Hidden input to submit the value via formData */}
                  <input type="hidden" name="venueId" value={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Hidden input to submit the value via formData */}
                  <input
                    type="hidden"
                    name="categoryId"
                    value={field.value}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Image URL (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isFree"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    name="isFree"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>This is a free event</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="rock, indie, outdoor (comma-separated)"
                    name="tags"
                    defaultValue={
                      Array.isArray(field.value)
                        ? field.value.join(", ")
                        : ""
                    }
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean);
                      field.onChange(tags);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Loader2Icon className="size-4 animate-spin" />}
          Submit Event for Review
        </Button>
      </form>
    </Form>
  );
}
