import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to public/uploads
    const uploadsFolder = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsFolder, { recursive: true });

    // Generate sanitized unique filename
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFilename = `${Date.now()}-${cleanName}`;
    const destinationPath = join(uploadsFolder, uniqueFilename);

    await writeFile(destinationPath, buffer);

    const fileUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({ fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal file upload failure" }, { status: 500 });
  }
}
