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

    const categories = await db.assetCategory.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "Admin" && user.role !== "AssetManager")) {
      return NextResponse.json({ error: "Forbidden: Admin or Asset Manager privileges required" }, { status: 403 });
    }

    const { name, customFields } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const existing = await db.assetCategory.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Category with this name already exists" }, { status: 409 });
    }

    let customFieldsStr = "[]";
    if (customFields) {
      customFieldsStr = typeof customFields === "string" ? customFields : JSON.stringify(customFields);
    }

    const category = await db.assetCategory.create({
      data: {
        name,
        customFields: customFieldsStr,
      },
    });

    await db.activityLog.create({
      data: {
        employeeId: user.id,
        action: "CreateCategory",
        details: `Created asset category: ${name}`,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
