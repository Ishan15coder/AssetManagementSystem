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

    if (action === "IMPORT") {
      const { assets } = body;
      if (!Array.isArray(assets) || assets.length === 0) {
        return NextResponse.json({ error: "Assets list required" }, { status: 400 });
      }

      try {
        const results = await db.$transaction(async (tx) => {
          const count = await tx.asset.count();
          const created = [];
          
          for (let i = 0; i < assets.length; i++) {
            const a = assets[i];
            
            if (!a.name) throw new Error(`Asset name required on row ${i + 1}`);
            if (!a.serialNumber) throw new Error(`Serial number required for "${a.name}" on row ${i + 1}`);
            
            const existing = await tx.asset.findUnique({ where: { serialNumber: a.serialNumber } });
            if (existing) {
              throw new Error(`Asset with S/N "${a.serialNumber}" already registered (Row ${i + 1})`);
            }

            let catId = a.categoryId ? parseInt(a.categoryId) : null;
            if (!catId && a.categoryName) {
              const existingCat = await tx.assetCategory.findUnique({
                where: { name: a.categoryName }
              });
              if (existingCat) {
                catId = existingCat.id;
              } else {
                const newCat = await tx.assetCategory.create({
                  data: { name: a.categoryName }
                });
                catId = newCat.id;
              }
            }

            if (!catId) {
              throw new Error(`Category mapping failed for row ${i + 1}`);
            }

            const tag = `AF-${String(count + 1 + i).padStart(4, "0")}`;
            const createdAsset = await tx.asset.create({
              data: {
                tag,
                name: a.name,
                serialNumber: a.serialNumber,
                categoryId: catId,
                acquisitionDate: a.acquisitionDate ? new Date(a.acquisitionDate) : new Date(),
                acquisitionCost: parseFloat(a.acquisitionCost || "0"),
                condition: a.condition || "Good",
                location: a.location || "HQ",
                isBookable: a.isBookable === true || String(a.isBookable).toLowerCase() === "true" || String(a.isBookable).toLowerCase() === "yes",
                status: "Available",
              }
            });
            created.push(createdAsset);
          }

          const logs = created.map((asset) => ({
            employeeId: user.id,
            action: "RegisterAsset",
            details: `Imported asset: ${asset.name} (Tag: ${asset.tag}, S/N: ${asset.serialNumber}) via CSV`,
          }));
          await tx.activityLog.createMany({ data: logs });

          return created;
        });

        return NextResponse.json({ success: true, message: `Successfully imported ${results.length} assets` });
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/assets/bulk error:", error);
    return NextResponse.json({ error: "Bulk operation failed: " + error.message }, { status: 500 });
  }
}
