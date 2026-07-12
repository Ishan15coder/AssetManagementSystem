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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    const location = searchParams.get("location");
    const query = searchParams.get("query"); // general search for tag/name/serial

    const where: any = {};

    if (status) where.status = status;
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (location) where.location = { contains: location };

    if (query) {
      where.OR = [
        { tag: { contains: query } },
        { name: { contains: query } },
        { serialNumber: { contains: query } },
      ];
    }

    const assets = await db.asset.findMany({
      where,
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
    });

    return NextResponse.json({ assets });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
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
