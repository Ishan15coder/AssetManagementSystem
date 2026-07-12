import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { allocationSchema } from "@/lib/validations";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "AssetManager" && user.role !== "Admin")) {
      return NextResponse.json({ error: "Forbidden: Asset Manager or Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const result = allocationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { assetId, employeeId, departmentId, expectedReturnDate } = result.data;

    /*
     * We execute the allocation and status updates inside a transaction to prevent 
     * race conditions where two managers assign the same asset at the same time.
     */
    const allocation = await db.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        throw new Error("Asset not found");
      }

      if (asset.status !== "Available") {
        throw new Error(`Asset is not available for allocation. Current status: ${asset.status}`);
      }

      // Create allocation record
      const alloc = await tx.allocation.create({
        data: {
          assetId,
          employeeId: employeeId || null,
          departmentId: departmentId || null,
          expectedReturnDate,
          status: "Active",
        },
      });

      // Update asset status
      await tx.asset.update({
        where: { id: assetId },
        data: { status: "Allocated" },
      });

      // Notify the employee of the new assignment
      if (employeeId) {
        await tx.notification.create({
          data: {
            employeeId,
            type: "Alert",
            message: `Asset ${asset.name} (${asset.tag}) has been allocated to you.`,
          },
        });
      }

      return alloc;
    });

    const targetDetails = employeeId
      ? `employee ID: ${employeeId}`
      : `department ID: ${departmentId}`;

    await db.activityLog.create({
      data: {
        employeeId: user.id,
        action: "AllocateAsset",
        details: `Allocated asset ID: ${assetId} to ${targetDetails}`,
      },
    });

    return NextResponse.json({ message: "Asset allocated successfully", allocation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to allocate asset" }, { status: 500 });
  }
}
