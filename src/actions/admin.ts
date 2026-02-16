"use server";

import { auth } from "@/lib/auth";
import { updateUserRole } from "@/lib/db/queries/users";
import {
  getEventCount,
  getVenueCount,
  getPendingSubmissionCount,
  getTotalTicketsSold,
} from "@/lib/db/queries/admin";

export async function updateUserRoleAction(userId: string, role: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized. Admin access required." };
  }

  const validRoles = ["user", "promoter", "admin"] as const;
  if (!validRoles.includes(role as (typeof validRoles)[number])) {
    return { error: "Invalid role. Must be one of: user, promoter, admin." };
  }

  try {
    await updateUserRole(userId, role as (typeof validRoles)[number]);
    return { success: true };
  } catch {
    return { error: "Failed to update user role." };
  }
}

export async function getAdminStatsAction() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return { error: "Unauthorized. Admin access required." };
  }

  try {
    const [totalEvents, totalVenues, pendingSubmissions, totalTicketsSold] =
      await Promise.all([
        getEventCount(),
        getVenueCount(),
        getPendingSubmissionCount(),
        getTotalTicketsSold(),
      ]);

    return {
      success: true,
      data: {
        totalEvents,
        totalVenues,
        pendingSubmissions,
        totalTicketsSold,
      },
    };
  } catch {
    return { error: "Failed to fetch admin stats." };
  }
}
