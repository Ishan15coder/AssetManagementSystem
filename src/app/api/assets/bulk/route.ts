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

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "AssetManager" && user.role !== "Admin")) {
      return NextResponse.json({ error: "Forbidden: Management privilege required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, assetIds, status } = body;

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json({ error: "No assets selected" }, { status: 400 });
    }

    if (action === "UPDATE_STATUS") {
      if (!status) return NextResponse.json({ error: "Status required" }, { status: 400 });

      await db.$transaction(async (tx) => {
        // Update all assets
        await tx.asset.updateMany({
          where: { id: { in: assetIds } },
          data: { status },
        });

        // Generate activity logs
        const logs = assetIds.map((id) => ({
          employeeId: user.id,
          action: "UpdateAsset",
          details: JSON.stringify({
            before: { status: "Multiple" },
            after: { status },
            info: "Bulk status update",
            assetId: id
          }),
        }));
        await tx.activityLog.createMany({ data: logs });
      });

      return NextResponse.json({ success: true, message: `Updated ${assetIds.length} assets` });
    }

    if (action === "DELETE") {
      await db.$transaction(async (tx) => {
        // Delete all assets (ensure cascading deletes are handled by schema or manually)
        await tx.asset.deleteMany({
          where: { id: { in: assetIds } },
        });

        // Generate activity logs
        const logs = assetIds.map((id) => ({
          employeeId: user.id,
          action: "DeleteAsset",
          details: `Bulk deleted asset ID: ${id}`,
        }));
        await tx.activityLog.createMany({ data: logs });
      });

      return NextResponse.json({ success: true, message: `Deleted ${assetIds.length} assets` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/assets/bulk error:", error);
    return NextResponse.json({ error: "Bulk operation failed: " + error.message }, { status: 500 });
  }
}
