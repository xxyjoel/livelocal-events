export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getVenues } from "@/lib/db/queries/venues";
import { deleteVenueAction } from "@/lib/actions/venues";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  MapPinIcon,
} from "lucide-react";

export default async function AdminVenuesPage() {
  const venues = await getVenues();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Venues</h1>
          <p className="mt-2 text-muted-foreground">
            Create, edit, and manage venues on the platform.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/venues/new">
            <PlusIcon className="size-4" />
            New Venue
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        {venues.length === 0 ? (
          <div className="rounded-xl border">
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
              <MapPinIcon className="size-10 opacity-50" />
              <div className="text-center">
                <p className="font-medium">No venues yet</p>
                <p className="mt-1 text-sm">
                  Create your first venue to get started.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/admin/venues/new">
                  <PlusIcon className="size-4" />
                  Create Venue
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City / State</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venues.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell className="font-medium">{venue.name}</TableCell>
                    <TableCell>
                      {venue.city && venue.state
                        ? `${venue.city}, ${venue.state}`
                        : venue.city || venue.state || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{venue.source}</Badge>
                    </TableCell>
                    <TableCell>
                      {venue.isVerified ? (
                        <Badge variant="default">Verified</Badge>
                      ) : (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon-xs">
                          <Link
                            href={`/admin/venues/${venue.id}/edit`}
                            title="Edit venue"
                          >
                            <PencilIcon className="size-3" />
                          </Link>
                        </Button>
                        <form
                          action={async () => {
                            "use server";
                            await deleteVenueAction(venue.id);
                          }}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-xs"
                            title="Delete venue"
                          >
                            <Trash2Icon className="size-3 text-destructive" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
