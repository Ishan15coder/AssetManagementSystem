import { db as prisma } from "../src/lib/db";
import { hash } from "bcryptjs";

async function main() {
  const passwordHash = await hash("password123", 10);
  
  const dept = await prisma.department.findFirst();
  if (!dept) {
    console.log("No departments found. Skipping demo user creation.");
    return;
  }

  const users = [
    { name: "Vivaan Patel",    role: "AssetManager", email: "manager@assetflow.com" },
    { name: "Aditya Singh",    role: "DeptHead",     email: "elena.it@assetflow.com"},
    { name: "Aadhya Joshi",    role: "Employee",     email: "david@assetflow.com"   },
    { name: "Vihaan Gupta",    role: "Employee",     email: "priya@assetflow.com"   },
  ];

  for (const u of users) {
    await prisma.employee.upsert({
      where: { email: u.email },
      update: { password: passwordHash, name: u.name, role: u.role },
      create: { 
        name: u.name, 
        email: u.email, 
        password: passwordHash, 
        role: u.role, 
        departmentId: dept.id 
      }
    });
  }
  
  // Also ensure Amit Admin has the right password just in case
  await prisma.employee.updateMany({
    where: { email: "admin@assetflow.com" },
    data: { password: passwordHash }
  });

  console.log("Demo users seeded successfully.");
}

main().finally(() => prisma.$disconnect());
