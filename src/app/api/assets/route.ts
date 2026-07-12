import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { assetSchema } from "@/lib/validations";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    const location = searchParams.get("location");
    const query = searchParams.get("query"); // general search for tag/name/serial
    
    // Pagination params
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Advanced filtering params
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const acquiredAfter = searchParams.get("acquiredAfter");
    const acquiredBefore = searchParams.get("acquiredBefore");

    const where: any = {};

    // Support multiple comma-separated statuses/categories if needed
    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length > 1 ? { in: statuses } : status;
    }
    if (categoryId) {
      const ids = categoryId.split(",").map(Number);
      where.categoryId = ids.length > 1 ? { in: ids } : parseInt(categoryId);
    }
    if (location) where.location = { contains: location };

    if (query) {
      where.OR = [
        { tag: { contains: query } },
        { name: { contains: query } },
        { serialNumber: { contains: query } },
      ];
    }

    // Apply numerical/date advanced filters
    if (minPrice || maxPrice) {
      where.acquisitionCost = {};
      if (minPrice) where.acquisitionCost.gte = parseFloat(minPrice);
      if (maxPrice) where.acquisitionCost.lte = parseFloat(maxPrice);
    }
    if (acquiredAfter || acquiredBefore) {
      where.acquisitionDate = {};
      if (acquiredAfter) where.acquisitionDate.gte = new Date(acquiredAfter);
      if (acquiredBefore) where.acquisitionDate.lte = new Date(acquiredBefore);
    }

    const [total, assets] = await db.$transaction([
      db.asset.count({ where }),
      db.asset.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          allocations: {
            where: { status: "Active" },
            include: {
              employee: { select: { id: true, name: true, email: true } },
              department: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { id: "desc" },
      })
    ]);

    // RBAC: Strip allocations the user is not authorized to see
    if (user.role === "Employee" || user.role === "DeptHead") {
      assets.forEach((asset) => {
        asset.allocations = asset.allocations.filter((alloc) => {
          if (user.role === "Employee") {
            return alloc.employeeId === user.id;
          } else if (user.role === "DeptHead") {
            return (
              alloc.departmentId === user.departmentId ||
              (alloc.employee && (alloc.employee as any).departmentId === user.departmentId)
            );
          }
          return false;
        });
      });
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ 
      assets, 
      meta: { total, page, limit, totalPages } 
    });
  } catch (error: any) {
    console.error("GET /api/assets error:", error);
    return NextResponse.json({ error: "Failed to fetch assets: " + error.message, stack: error.stack }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "AssetManager" && user.role !== "Admin")) {
      return NextResponse.json({ error: "Forbidden: Asset Manager or Admin privilege required" }, { status: 403 });
    }

    const body = await request.json();
    const result = assetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, serialNumber, categoryId, acquisitionDate, acquisitionCost, condition, location, isBookable, photoUrl, documentUrl } = result.data;

    // Check unique serial number
    const existing = await db.asset.findUnique({ where: { serialNumber } });
    if (existing) {
      return NextResponse.json({ error: "Asset with this serial number already registered" }, { status: 409 });
    }

    // Auto-generate asset tag (e.g. AF-0001)
    const count = await db.asset.count();
    const tag = `AF-${String(count + 1).padStart(4, "0")}`;

    const asset = await db.asset.create({
      data: {
        tag,
        name,
        serialNumber,
        categoryId,
        acquisitionDate,
        acquisitionCost,
        condition,
        location,
        isBookable,
        photoUrl: photoUrl || null,
        documentUrl: documentUrl || null,
        status: "Available",
      },
    });

    await db.activityLog.create({
      data: {
        employeeId: user.id,
        action: "RegisterAsset",
        details: `Registered asset: ${name} (Tag: ${tag}, S/N: ${serialNumber})`,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to register asset" }, { status: 500 });
  }
}
