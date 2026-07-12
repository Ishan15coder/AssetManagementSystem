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

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "Admin" && user.role !== "AssetManager") {
      return NextResponse.json({ error: "Forbidden: Management privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const [total, logs] = await db.$transaction([
      db.activityLog.count(),
      db.activityLog.findMany({
        skip,
        take: limit,
        include: {
          employee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: "desc" },
      })
    ]);
    
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ 
      logs,
      meta: { total, page, limit, totalPages }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
