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

    // Auto-generate reminders for resource bookings starting in the next 1 hour
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingBookings = await db.resourceBooking.findMany({
      where: {
        employeeId: user.id,
        status: "Upcoming",
        startDate: {
          gte: now,
          lte: oneHourFromNow,
        },
      },
      include: {
        asset: { select: { name: true, tag: true } },
      },
    });

    for (const booking of upcomingBookings) {
      const title = `Booking Reminder`;
      const detailsPrefix = `Your booking for ${booking.asset.name} (${booking.asset.tag})`;
      
      const existing = await db.notification.findFirst({
        where: {
          employeeId: user.id,
          title,
          details: { contains: detailsPrefix },
        },
      });

      if (!existing) {
        const minutesLeft = Math.round((new Date(booking.startDate).getTime() - now.getTime()) / (60 * 1000));
        await db.notification.create({
          data: {
            employeeId: user.id,
            title,
            details: `${detailsPrefix} starts in ${minutesLeft} minutes.`,
            type: "Reminder",
            isRead: false,
          },
        });
      }
    }

    const notifications = await db.notification.findMany({
      where: { employeeId: user.id },
      orderBy: { createdDate: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, markAll } = await request.json().catch(() => ({}));

    if (markAll) {
      await db.notification.updateMany({
        where: { employeeId: user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    if (!id) {
      return NextResponse.json({ error: "Notification ID or markAll is required" }, { status: 400 });
    }

    const notificationId = parseInt(id);
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.employeeId !== user.id) {
      return NextResponse.json({ error: "Notification not found or access denied" }, { status: 404 });
    }

    const updated = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "Notification marked as read", notification: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
