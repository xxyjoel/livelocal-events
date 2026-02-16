"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ticketTypeSchema,
  type TicketTypeInput,
} from "@/lib/validators/ticket-types";
import type { TicketTypeActionState } from "@/lib/actions/ticket-types";
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
import { Loader2Icon } from "lucide-react";

interface TicketTypeFormProps {
  defaultValues?: Partial<TicketTypeInput>;
  action: (
    prevState: TicketTypeActionState,
    formData: FormData
  ) => Promise<TicketTypeActionState>;
  onCancel?: () => void;
  onSuccess?: () => void;
}

function toDatetimeLocal(date: Date | string | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TicketTypeForm({
  defaultValues,
  action,
  onCancel,
  onSuccess,
}: TicketTypeFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (prevState: TicketTypeActionState, formData: FormData) => {
      const result = await action(prevState, formData);
      if (result.success) {
        onSuccess?.();
      }
      return result;
    },
    { success: false }
  );

  const form = useForm<TicketTypeInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ticketTypeSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      quantity: 100,
      maxPerOrder: 10,
      salesStart: undefined,
      salesEnd: undefined,
      sortOrder: 0,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ticket Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. General Admission" {...field} />
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
                  placeholder="Optional description for this ticket type..."
                  rows={2}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="100"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxPerOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Per Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="10"
                    {...field}
                    value={field.value ?? ""}
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
            name="salesStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sales Start</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={
                      field.value ? toDatetimeLocal(field.value) : ""
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : undefined
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
            name="salesEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sales End</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={
                      field.value ? toDatetimeLocal(field.value) : ""
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            {defaultValues ? "Update Ticket Type" : "Add Ticket Type"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
