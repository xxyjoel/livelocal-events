"use client";

import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/utils";
import {
  createTicketTypeAction,
  updateTicketTypeAction,
  deleteTicketTypeAction,
} from "@/lib/actions/ticket-types";
import { TicketTypeForm } from "./ticket-type-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, PencilIcon, Trash2Icon, Loader2Icon } from "lucide-react";

interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  sold: number;
  maxPerOrder: number;
  salesStart: Date | null;
  salesEnd: Date | null;
  sortOrder: number;
}

interface TicketTypesManagerProps {
  eventId: string;
  ticketTypes: TicketType[];
}

export function TicketTypesManager({
  eventId,
  ticketTypes,
}: TicketTypesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const boundCreateAction = createTicketTypeAction.bind(null, eventId);

  function handleEdit(ticketType: TicketType) {
    setEditingId(ticketType.id);
    setShowForm(false);
    setDeleteError(null);
  }

  function handleDelete(ticketTypeId: string) {
    setDeleteError(null);
    setDeletingId(ticketTypeId);
    startTransition(async () => {
      const result = await deleteTicketTypeAction(ticketTypeId);
      if (!result.success) {
        setDeleteError(result.error ?? "Failed to delete ticket type.");
      }
      setDeletingId(null);
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setDeleteError(null);
  }

  function handleCancelAdd() {
    setShowForm(false);
    setDeleteError(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Ticket Types
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage ticket types and pricing for this event.
          </p>
        </div>
        {!showForm && !editingId && (
          <Button
            onClick={() => {
              setShowForm(true);
              setDeleteError(null);
            }}
            size="sm"
          >
            <PlusIcon className="size-4" />
            Add Ticket Type
          </Button>
        )}
      </div>

      {deleteError && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {deleteError}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Ticket Type</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketTypeForm
              action={boundCreateAction}
              onCancel={handleCancelAdd}
              onSuccess={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {ticketTypes.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No ticket types yet. Add one to start selling tickets.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {ticketTypes.map((ticketType) => {
          const isEditing = editingId === ticketType.id;
          const isDeleting = deletingId === ticketType.id;
          const soldPercentage =
            ticketType.quantity > 0
              ? Math.round((ticketType.sold / ticketType.quantity) * 100)
              : 0;
          const isSoldOut = ticketType.sold >= ticketType.quantity;

          if (isEditing) {
            const boundUpdateAction = updateTicketTypeAction.bind(
              null,
              ticketType.id
            );
            return (
              <Card key={ticketType.id}>
                <CardHeader>
                  <CardTitle>Edit: {ticketType.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TicketTypeForm
                    defaultValues={{
                      name: ticketType.name,
                      description: ticketType.description ?? "",
                      price: ticketType.price / 100, // Convert cents to dollars for form
                      quantity: ticketType.quantity,
                      maxPerOrder: ticketType.maxPerOrder,
                      salesStart: ticketType.salesStart ?? undefined,
                      salesEnd: ticketType.salesEnd ?? undefined,
                      sortOrder: ticketType.sortOrder,
                    }}
                    action={boundUpdateAction}
                    onCancel={handleCancelEdit}
                    onSuccess={handleCancelEdit}
                  />
                </CardContent>
              </Card>
            );
          }

          return (
            <Card key={ticketType.id}>
              <CardContent className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{ticketType.name}</span>
                    <Badge variant="secondary">
                      {formatPrice(ticketType.price)}
                    </Badge>
                    {isSoldOut && (
                      <Badge variant="destructive">Sold Out</Badge>
                    )}
                  </div>
                  {ticketType.description && (
                    <p className="text-sm text-muted-foreground">
                      {ticketType.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {ticketType.sold} / {ticketType.quantity} sold
                    </span>
                    <span>Max {ticketType.maxPerOrder} per order</span>
                  </div>
                  {/* Progress bar showing sold percentage */}
                  <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isSoldOut
                          ? "bg-destructive"
                          : soldPercentage > 75
                            ? "bg-orange-500"
                            : "bg-primary"
                      }`}
                      style={{ width: `${soldPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(ticketType)}
                  >
                    <PencilIcon className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(ticketType.id)}
                    disabled={isDeleting || isPending}
                  >
                    {isDeleting ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <Trash2Icon className="size-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
