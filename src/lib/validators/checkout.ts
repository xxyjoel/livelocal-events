import { z } from "zod";

export const checkoutSchema = z.object({
  eventId: z.string().min(1),
  items: z.array(
    z.object({
      ticketTypeId: z.string().min(1),
      quantity: z.coerce.number().min(1).max(10),
    })
  ).min(1, "Select at least one ticket"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
