import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { bookingSchema } from "@/lib/validations";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const bookingId = parseInt(resolvedParams.id);

    const booking = await db.resourceBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.employeeId !== user.id && user.role !== "Admin" && user.role !== "AssetManager") {
      return NextResponse.json({ error: "Forbidden: You are not authorized to cancel this booking" }, { status: 403 });
    }

    const updatedBooking = await db.resourceBooking.update({
      where: { id: bookingId },
      data: { status: "Cancelled" },
    });

    await db.activityLog.create({
      data: {
        employeeId: user.id,
        action: "CancelBooking",
        details: `Cancelled booking ID: ${bookingId} for resource ID: ${booking.assetId}`,
      },
    });

    return NextResponse.json({ message: "Booking cancelled successfully", booking: updatedBooking });
  } catch (error) {
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const bookingId = parseInt(resolvedParams.id);
    const body = await request.json();

    const booking = await db.resourceBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.employeeId !== user.id && user.role !== "Admin" && user.role !== "AssetManager") {
      return NextResponse.json({ error: "Forbidden: You are not authorized to reschedule this booking" }, { status: 403 });
    }

    // Validate request schema using validations.ts
    // Safe validation needs body with assetId
    body.assetId = booking.assetId;
    const result = bookingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { startDate, endDate } = result.data;

    const updatedBooking = await db.$transaction(async (tx) => {
      // Check schedule overlaps excluding current booking ID
      const overlappingBookings = await tx.resourceBooking.findFirst({
        where: {
          assetId: booking.assetId,
          status: { in: ["Upcoming", "Ongoing"] },
          id: { not: bookingId },
          AND: [
            { startDate: { lt: endDate } },
            { endDate: { gt: startDate } },
          ],
        },
        include: {
          employee: { select: { name: true } },
        },
      });

      if (overlappingBookings) {
        throw new Error(
          `Schedule overlap. This slot is currently booked by ${overlappingBookings.employee.name} (${overlappingBookings.startDate.toISOString().substring(11, 16)} - ${overlappingBookings.endDate.toISOString().substring(11, 16)})`
        );
      }

      const updated = await tx.resourceBooking.update({
        where: { id: bookingId },
        data: {
          startDate,
          endDate,
          status: "Upcoming", // reset status to Upcoming since it's rescheduled
        },
      });

      return updated;
    });

    await db.activityLog.create({
      data: {
        employeeId: user.id,
        action: "RescheduleBooking",
        details: `Rescheduled booking ID: ${bookingId} to: ${startDate.toISOString()} - ${endDate.toISOString()}`,
      },
    });

    return NextResponse.json({ message: "Booking rescheduled successfully", booking: updatedBooking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reschedule booking" }, { status: 500 });
  }
}
