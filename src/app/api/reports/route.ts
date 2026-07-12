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

    // 1. Asset status counts
    const statusCounts = await db.asset.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    // 2. Department-wise allocations
    const deptAllocations = await db.allocation.groupBy({
      by: ["departmentId"],
      where: { status: "Active", departmentId: { not: null } },
      _count: { _all: true },
    });

    const departments = await db.department.findMany({
      select: { id: true, name: true },
    });

    const deptStats = deptAllocations.map((item) => {
      const deptName = departments.find((d) => d.id === item.departmentId)?.name || "Unknown";
      return {
        department: deptName,
        count: item._count._all,
      };
    });

    // 3. Resource booking frequencies
    const bookingCounts = await db.resourceBooking.groupBy({
      by: ["assetId"],
      _count: { _all: true },
    });

    const assets = await db.asset.findMany({
      select: { id: true, name: true, tag: true },
    });

    const bookingStats = bookingCounts.map((item) => {
      const asset = assets.find((a) => a.id === item.assetId);
      return {
        assetName: asset ? `${asset.name} (${asset.tag})` : "Unknown",
        count: item._count._all,
      };
    });

    // 4. Maintenance requests priorities
    const maintenanceCounts = await db.maintenanceRequest.groupBy({
      by: ["priority"],
      _count: { _all: true },
    });

    const maintenanceStats = maintenanceCounts.map((item) => ({
      priority: item.priority,
      count: item._count._all,
    }));

    // 5. Utilization Trends (Most Used vs Idle Assets)
    const allAssets = await db.asset.findMany({
      include: {
        category: { select: { name: true } },
        _count: {
          select: { allocations: true, bookings: true },
        },
      },
    });

    const utilization = allAssets.map((a) => ({
      tag: a.tag,
      name: a.name,
      count: a._count.allocations + a._count.bookings,
    }));

    const mostUsed = [...utilization].sort((a, b) => b.count - a.count).slice(0, 5);
    const idle = [...utilization].sort((a, b) => a.count - b.count).slice(0, 5);

    // 6. Assets Nearing Retirement
    const now = new Date();
    const nearingRetirement = allAssets
      .map((a) => {
        let lifespanMonths = 60; // default 5 years
        const catName = a.category?.name || "";
        if (catName.includes("Electronics")) lifespanMonths = 36;
        else if (catName.includes("Furniture")) lifespanMonths = 84;
        else if (catName.includes("Vehicles")) lifespanMonths = 120;
        else if (catName.includes("Office") || catName.includes("Space")) lifespanMonths = 240;

        const retirementDate = new Date(a.acquisitionDate);
        retirementDate.setMonth(retirementDate.getMonth() + lifespanMonths);
        
        // Approximate difference in months
        const diffTime = retirementDate.getTime() - now.getTime();
        const monthsRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30.4));

        return {
          tag: a.tag,
          name: a.name,
          retirementDate: retirementDate.toISOString().split("T")[0],
          monthsRemaining,
        };
      })
      .sort((a, b) => a.monthsRemaining - b.monthsRemaining)
      .slice(0, 8);

    // 7. Booking Heatmap (by UTC Hour)
    const allBookings = await db.resourceBooking.findMany({
      where: { status: { in: ["Upcoming", "Ongoing", "Completed"] } },
    });

    const hourlyCounts = Array(24).fill(0);
    allBookings.forEach((b) => {
      const hour = new Date(b.startDate).getUTCHours();
      hourlyCounts[hour]++;
    });

    const heatmap = hourlyCounts.map((count, hour) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      count,
    }));

    // 8. Dashboard KPIs: Maintenance Today, Pending Transfers, Upcoming Returns
    const maintenanceToday = await db.maintenanceRequest.count({
      where: {
        status: { in: ["Approved", "InProgress"] },
      },
    });

    const pendingTransfers = await db.transferRequest.count({
      where: {
        status: "Pending",
      },
    });

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const upcomingReturns = await db.allocation.count({
      where: {
        status: "Active",
        expectedReturnDate: {
          gte: new Date(),
          lte: threeDaysFromNow,
        },
      },
    });

    return NextResponse.json({
      statusCounts: statusCounts.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      departmentAllocations: deptStats,
      resourceBookings: bookingStats,
      maintenanceRequests: maintenanceStats,
      mostUsed,
      idle,
      nearingRetirement,
      heatmap,
      maintenanceToday,
      pendingTransfers,
      upcomingReturns,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports and analytics" }, { status: 500 });
  }
}

