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

    if (user.role !== "Admin" && user.role !== "AssetManager") {
      return NextResponse.json({ error: "Forbidden: Management privileges required" }, { status: 403 });
    }

    const logs = await db.activityLog.findMany({
      include: {
        employee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { timestamp: "desc" },
      take: 100, // Cap results to prevent long outputs/loads
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
