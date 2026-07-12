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
    const departmentId = parseInt(resolvedParams.id);

    const { name, headId, parentId, status } = body;

    const dept = await db.department.findUnique({
      where: { id: departmentId },
    });

    if (!dept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    if (name && name !== dept.name) {
      const existing = await db.department.findUnique({ where: { name } });
      if (existing) {
        return NextResponse.json({ error: "Department with this name already exists" }, { status: 409 });
      }
    }

    // Verify parent ID hierarchy loops (a department cannot be its own parent or a descendant)
    if (parentId) {
      const targetParentId = parseInt(parentId);
      if (targetParentId === departmentId) {
        return NextResponse.json({ error: "A department cannot be its own parent scope" }, { status: 400 });
      }

      // Recursively trace up the parent chain to ensure no circular references are created
      let currentParentId: number | null = targetParentId;
      while (currentParentId) {
        const parentDept: any = await db.department.findUnique({
          where: { id: currentParentId },
          select: { id: true, parentId: true }
        });
        if (!parentDept) break;
        if (parentDept.parentId === departmentId) {
          return NextResponse.json({
            error: "Cyclical hierarchy loop detected: Selected parent department is already a sub-department of this one."
          }, { status: 400 });
        }
        currentParentId = parentDept.parentId;
      }
    }

    const updatedDept = await db.department.update({
      where: { id: departmentId },
      data: {
        name: name || undefined,
        headId: headId !== undefined ? (headId ? parseInt(headId) : null) : undefined,
        parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : undefined,
        status: status || undefined,
      },
    });

    await db.activityLog.create({
      data: {
        employeeId: admin.id,
        action: "UpdateDepartment",
        details: `Updated department ID: ${departmentId} (${updatedDept.name}, status: ${updatedDept.status})`,
      },
    });

    return NextResponse.json({ department: updatedDept });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const departmentId = parseInt(resolvedParams.id);

    const dept = await db.department.findUnique({
      where: { id: departmentId },
    });

    if (!dept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // Check if department has active allocations or employees
    const employeesLinked = await db.employee.findFirst({
      where: { departmentId },
    });

    if (employeesLinked) {
      return NextResponse.json({ error: "Cannot delete department while employees are assigned to it. Deactivate instead." }, { status: 400 });
    }

    await db.department.delete({
      where: { id: departmentId },
    });

    await db.activityLog.create({
      data: {
        employeeId: admin.id,
        action: "DeleteDepartment",
        details: `Deleted department ID: ${departmentId} (${dept.name})`,
      },
    });

    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
