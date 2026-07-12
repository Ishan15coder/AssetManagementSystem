import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "AssetManager" && user.role !== "Admin")) {
      return NextResponse.json({ error: "Forbidden: Manager or Admin privileges required" }, { status: 403 });
    }

    const { status, assignedTechnicianId, resolutionNotes } = await request.json();
    const resolvedParams = await params;
    const requestId = parseInt(resolvedParams.id);

    const maintReq = await db.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!maintReq) {
      return NextResponse.json({ error: "Maintenance request not found" }, { status: 404 });
    }

    const updatedRequest = await db.$transaction(async (tx) => {
      const updated = await tx.maintenanceRequest.update({
        where: { id: requestId },
        data: {
          status,
          assignedTechnicianId: assignedTechnicianId ? parseInt(assignedTechnicianId) : undefined,
          resolutionNotes,
        },
      });

      /*
       * On approval, the asset enters maintenance state; on resolution, 
       * it reverts to Available so it can be re-allocated.
       */
      if (status === "Approved") {
        await tx.asset.update({
          where: { id: maintReq.assetId },
          data: { status: "UnderMaintenance" },
        });
      } else if (status === "Resolved") {
        await tx.asset.update({
          where: { id: maintReq.assetId },
          data: { status: "Available" },
        });
      }

      // Notify employee of maintenance update
      await tx.notification.create({
        data: {
          employeeId: maintReq.employeeId,
          type: status === "Rejected" ? "Warning" : "Info",
          message: `Your maintenance request for asset ID: ${maintReq.assetId} has been updated to: ${status}.`,
        },
      });

      return updated;
    });

    await db.activityLog.create({
      data: {
        employeeId: user.id,
        action: "UpdateMaintenanceStatus",
        details: `Updated maintenance request ID: ${requestId} status to: ${status}`,
      },
    });

    return NextResponse.json({ message: "Maintenance request updated successfully", request: updatedRequest });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update maintenance request status" }, { status: 500 });
  }
}
