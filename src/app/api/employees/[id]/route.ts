import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "Admin") return null;
  return decoded;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const resolvedParams = await params;
    const targetEmployeeId = parseInt(resolvedParams.id);

    const { name, email, role, status, departmentId } = body;

    const employee = await db.employee.findUnique({
      where: { id: targetEmployeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Verify email uniqueness if email is changed
    if (email && email !== employee.email) {
      const existing = await db.employee.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Email address is already taken" }, { status: 409 });
      }
    }

    const updatedEmployee = await db.employee.update({
      where: { id: targetEmployeeId },
      data: {
        name: name || undefined,
        email: email || undefined,
        role: role || undefined,
        status: status || undefined,
        departmentId: departmentId !== undefined ? (departmentId ? parseInt(departmentId) : null) : undefined,
      },
    });

    await db.activityLog.create({
      data: {
        employeeId: admin.id,
        action: "UpdateEmployeeDetails",
        details: `Updated details for employee: ${employee.name} (${employee.email})`,
      },
    });

    return NextResponse.json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update employee details" }, { status: 500 });
  }
}
