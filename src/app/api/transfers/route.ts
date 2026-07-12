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

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transfers = await db.transferRequest.findMany({
      include: {
        asset: { select: { id: true, tag: true, name: true } },
        fromEmployee: { select: { id: true, name: true, email: true } },
        toEmployee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, id, assetId, toEmployeeId, reason } = await request.json();

    // 1. Handle raising a new transfer request
    if (action === "request") {
      if (!assetId || !toEmployeeId || !reason) {
        return NextResponse.json({ error: "Asset, target employee, and reason are required" }, { status: 400 });
      }

      // Check active allocation to find who currently has it
      const activeAllocation = await db.allocation.findFirst({
        where: { assetId: parseInt(assetId), status: "Active" },
      });

      if (!activeAllocation || !activeAllocation.employeeId) {
        return NextResponse.json({ error: "Asset must be currently allocated to raise a transfer request" }, { status: 400 });
      }

      const transfer = await db.transferRequest.create({
        data: {
          assetId: parseInt(assetId),
          fromEmployeeId: activeAllocation.employeeId,
          toEmployeeId: parseInt(toEmployeeId),
          reason,
          status: "Pending",
        },
      });

      return NextResponse.json({ message: "Transfer request raised successfully", transfer }, { status: 201 });
    }

    // 2. Handle approving/rejecting a transfer request (AssetManager or DeptHead of the department)
    if (action === "approve" || action === "reject") {
      if (!id) {
        return NextResponse.json({ error: "Transfer request ID is required" }, { status: 400 });
      }

      if (user.role !== "AssetManager" && user.role !== "Admin" && user.role !== "DeptHead") {
        return NextResponse.json({ error: "Forbidden: Manager or Department Head approval privileges required" }, { status: 403 });
      }

      const transferReq = await db.transferRequest.findUnique({
        where: { id: parseInt(id) },
      });

      if (!transferReq || transferReq.status !== "Pending") {
        return NextResponse.json({ error: "Transfer request not found or already processed" }, { status: 404 });
      }

      if (action === "reject") {
        const rejected = await db.$transaction(async (tx) => {
          const u = await tx.transferRequest.update({
            where: { id: transferReq.id },
            data: { status: "Rejected", approvedById: user.id, approvedDate: new Date() },
          });
          await tx.notification.create({
            data: {
              employeeId: transferReq.toEmployeeId,
              type: "Warning",
              message: `Transfer request for Asset ID: ${transferReq.assetId} was rejected.`,
            },
          });
          return u;
        });
        return NextResponse.json({ message: "Transfer request rejected", transfer: rejected });
      }

      // Run transaction to transfer the asset
      const approved = await db.$transaction(async (tx) => {
        // End current active allocation
        const activeAlloc = await tx.allocation.findFirst({
          where: { assetId: transferReq.assetId, status: "Active" },
        });

        if (activeAlloc) {
          await tx.allocation.update({
            where: { id: activeAlloc.id },
            data: {
              returnedDate: new Date(),
              conditionOnCheckIn: `Transferred automatically to employee ID: ${transferReq.toEmployeeId}`,
              status: "Returned",
            },
          });
        }

        // Create new allocation
        await tx.allocation.create({
          data: {
            assetId: transferReq.assetId,
            employeeId: transferReq.toEmployeeId,
            status: "Active",
          },
        });

        // Update transfer status
        const updatedReq = await tx.transferRequest.update({
          where: { id: transferReq.id },
          data: {
            status: "Approved",
            approvedById: user.id,
            approvedDate: new Date(),
          },
        });

        // Notify both personnel involved in the transfer
        await tx.notification.create({
          data: {
            employeeId: transferReq.toEmployeeId,
            type: "Alert",
            message: `Transfer approved. Asset ID: ${transferReq.assetId} is now allocated to you.`,
          },
        });

        await tx.notification.create({
          data: {
            employeeId: transferReq.fromEmployeeId,
            type: "Info",
            message: `Your Asset ID: ${transferReq.assetId} has been transferred.`,
          },
        });

        return updatedReq;
      });

      await db.activityLog.create({
        data: {
          employeeId: user.id,
          action: "ApproveTransfer",
          details: `Approved transfer of asset ID: ${transferReq.assetId} from employee ID: ${transferReq.fromEmployeeId} to employee ID: ${transferReq.toEmployeeId}`,
        },
      });

      return NextResponse.json({ message: "Transfer request approved and re-allocated", transfer: approved });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process transfer request" }, { status: 500 });
  }
}
