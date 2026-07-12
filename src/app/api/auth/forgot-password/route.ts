import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const employee = await db.employee.findUnique({
      where: { email },
    });

    if (!employee) {
      // For security in production, don't leak account existence, but for POC ERP we display helper error
      return NextResponse.json({ error: "No employee account found with this email address" }, { status: 404 });
    }

    const tempPassword = "AssetFlow123!";
    const newHash = hashPassword(tempPassword);

    await db.employee.update({
      where: { id: employee.id },
      data: { password: newHash },
    });

    await db.activityLog.create({
      data: {
        employeeId: employee.id,
        action: "ResetPassword",
        details: `Reset password for employee account: ${employee.email}`,
      },
    });

    return NextResponse.json({
      message: "Password reset completed successfully",
      tempPassword,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
