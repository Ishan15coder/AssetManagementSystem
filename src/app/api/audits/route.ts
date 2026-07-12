import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { auditCycleSchema } from "@/lib/validations";

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

    const cycles = await db.auditCycle.findMany({
      include: {
        auditor: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            asset: { select: { id: true, tag: true, name: true, serialNumber: true } },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ cycles });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit cycles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "AssetManager" && user.role !== "Admin")) {
      return NextResponse.json({ error: "Forbidden: Manager or Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const { departmentId, location } = body;
    
    const result = auditCycleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, startDate, endDate, auditorId } = result.data;

    // Define database query filters based on selected audit scope
    const assetFilter: any = {
      status: { in: ["Available", "Allocated", "Reserved", "UnderMaintenance"] },
    };

    if (location && location.trim().length > 0) {
      assetFilter.location = { contains: location };
    }

    if (departmentId) {
      const deptIdNum = parseInt(departmentId);
      assetFilter.allocations = {
        some: {
          status: "Active",
          OR: [
            { departmentId: deptIdNum },
            { employee: { departmentId: deptIdNum } }
          ]
        }
      };
    }

    const cycle = await db.$transaction(async (tx) => {
      // Create cycle
      const newCycle = await tx.auditCycle.create({
        data: {
          name,
          startDate,
          endDate,
          auditorId,
          status: "Active",
        },
      });

      // Fetch scoped assets matching selection criteria
      const assets = await tx.asset.findMany({
        where: assetFilter,
      });

      // Create audit items checklist
      if (assets.length > 0) {
        await tx.auditItem.createMany({
          data: assets.map((asset) => ({
            cycleId: newCycle.id,
            assetId: asset.id,
            status: "Pending",
          })),
        });
      }

      return newCycle;
    });

    await db.activityLog.create({
      data: {
        employeeId: user.id,
        action: "CreateAuditCycle",
        details: `Created audit cycle: ${name} (Scope Dept: ${departmentId || "All"}, Scope Location: ${location || "All"})`,
      },
    });

    return NextResponse.json({ message: "Audit cycle created successfully", cycle }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create audit cycle" }, { status: 500 });
  }
}

