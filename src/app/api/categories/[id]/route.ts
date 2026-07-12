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
    if (!user || (user.role !== "Admin" && user.role !== "AssetManager")) {
      return NextResponse.json({ error: "Forbidden: Admin or Asset Manager privileges required" }, { status: 403 });
    }

    const { name, customFields } = await request.json();
    const resolvedParams = await params;
    const categoryId = parseInt(resolvedParams.id);

    const category = await db.assetCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    let customFieldsStr = category.customFields;
    if (customFields !== undefined) {
      customFieldsStr = typeof customFields === "string" ? customFields : JSON.stringify(customFields);
    }

    const updatedCategory = await db.assetCategory.update({
      where: { id: categoryId },
      data: {
        name: name || undefined,
        customFields: customFieldsStr,
      },
    });

    await db.activityLog.create({
      data: {
        employeeId: user.id,
        action: "UpdateCategory",
        details: `Updated asset category ID: ${categoryId} to: ${name || category.name}`,
      },
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const categoryId = parseInt(resolvedParams.id);

    const category = await db.assetCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if category has assets linked to it
    const assetsLinked = await db.asset.findFirst({
      where: { categoryId },
    });

    if (assetsLinked) {
      return NextResponse.json({ error: "Cannot delete category as it is currently linked to registered assets" }, { status: 400 });
    }

    await db.assetCategory.delete({
      where: { id: categoryId },
    });

    await db.activityLog.create({
      data: {
        employeeId: user.id,
        action: "DeleteCategory",
        details: `Deleted asset category ID: ${categoryId} (${category.name})`,
      },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
