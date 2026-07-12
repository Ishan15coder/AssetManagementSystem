const { PrismaClient } = require("@prisma/client");
const { PrismaLibSQL } = require("@prisma/adapter-libsql");
const bcrypt = require("bcryptjs");
require("dotenv").config();

let prisma;
if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  const adapter = new PrismaLibSQL({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

// Helper to get a random date between two dates
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to pick a random item from an array
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Starting INTENSE DB Seed...");

  // 1. Core Structure: Departments
  const depts = [
    await prisma.department.upsert({ where: { name: "Engineering" }, update: {}, create: { name: "Engineering", status: "Active" } }),
    await prisma.department.upsert({ where: { name: "Marketing" }, update: {}, create: { name: "Marketing", status: "Active" } }),
    await prisma.department.upsert({ where: { name: "IT Operations" }, update: {}, create: { name: "IT Operations", status: "Active" } }),
    await prisma.department.upsert({ where: { name: "Product Design" }, update: {}, create: { name: "Product Design", status: "Active" } }),
    await prisma.department.upsert({ where: { name: "Sales" }, update: {}, create: { name: "Sales", status: "Active" } })
  ];

  // 2. Core Structure: Users
  const passwordHash = await bcrypt.hash("password123", 10);
  
  // Fetch ALL existing employees to distribute data to them!
  const allEmployees = await prisma.employee.findMany();
  
  if (allEmployees.length === 0) {
    console.error("No employees found in the DB. Please create some users first.");
    return;
  }

  const standardEmployees = allEmployees.filter(e => e.role !== "Admin" && e.role !== "AssetManager");
  const adminOrManager = allEmployees.find(e => e.role === "Admin" || e.role === "AssetManager") || allEmployees[0];

  // 3. Core Structure: Categories
  const catElec = await prisma.assetCategory.upsert({ where: { name: "Electronics" }, update: {}, create: { name: "Electronics" } });
  const catVeh = await prisma.assetCategory.upsert({ where: { name: "Vehicles" }, update: {}, create: { name: "Vehicles" } });
  const catFurn = await prisma.assetCategory.upsert({ where: { name: "Furniture" }, update: {}, create: { name: "Furniture" } });
  const catSoft = await prisma.assetCategory.upsert({ where: { name: "Software Licenses" }, update: {}, create: { name: "Software Licenses" } });
  const categories = [catElec, catVeh, catFurn, catSoft];

  // 4. Generate 40 INTENSE Random Assets
  const assetTemplates = [
    { name: "MacBook Pro M3 Max", cost: 280000, cat: catElec.id, bookable: false }, // Cost in INR
    { name: "Dell XPS 17", cost: 210000, cat: catElec.id, bookable: false },
    { name: "Lenovo ThinkPad X1", cost: 160000, cat: catElec.id, bookable: false },
    { name: "Epson 4K Laser Projector", cost: 85000, cat: catElec.id, bookable: true },
    { name: "Godrej Interio Standing Desk", cost: 45000, cat: catFurn.id, bookable: false },
    { name: "Featherlite Ergonomic Chair", cost: 18000, cat: catFurn.id, bookable: false },
    { name: "Company Mahindra XUV700", cost: 2200000, cat: catVeh.id, bookable: true },
    { name: "Tata Nexon EV (Fleet)", cost: 1500000, cat: catVeh.id, bookable: true },
    { name: "Adobe Creative Cloud License", cost: 70000, cat: catSoft.id, bookable: false },
    { name: "Figma Enterprise License", cost: 90000, cat: catSoft.id, bookable: false },
    { name: "AWS Mumbai Region Keys", cost: 0, cat: catSoft.id, bookable: false },
    { name: "iPad Pro 12.9", cost: 95000, cat: catElec.id, bookable: true },
    { name: "Sony Alpha A7 IV Camera", cost: 210000, cat: catElec.id, bookable: true },
  ];

  const locations = ["Mumbai HQ - Floor 1", "Mumbai HQ - Floor 2", "Bengaluru Tech Park", "Pune Office", "Delhi NCR Branch", "Remote - IN"];
  const conditions = ["New", "Good", "Fair", "Poor"];
  const assetRecords = [];

  for (let i = 0; i < 100; i++) {
    const template = pickRandom(assetTemplates);
    const uniqueId = Math.floor(Math.random() * 90000) + 10000;
    const tag = `INT-${uniqueId}`;
    
    const asset = await prisma.asset.create({
      data: {
        tag: tag,
        name: `${template.name} #${uniqueId}`,
        serialNumber: `SN-${uniqueId}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        categoryId: template.cat,
        acquisitionDate: getRandomDate(new Date(2022, 0, 1), new Date()),
        acquisitionCost: template.cost * (0.9 + Math.random() * 0.2), // slight variance
        condition: pickRandom(conditions),
        location: pickRandom(locations),
        isBookable: template.bookable,
        status: "Available" // We will update this via allocations
      }
    });
    assetRecords.push(asset);
  }

  // 5. Generate Intense Workflows GUARANTEED FOR EVERY USER
  console.log("Generating guaranteed interlinked workflows for every user...");
  
  const now = new Date();
  
  // Keep track of which assets we've used so we don't double-allocate an asset that shouldn't be
  let assetIndex = 0;

  for (const employee of allEmployees) {
    if (assetIndex + 4 >= assetRecords.length) {
      // If we run out of unique assets, just break (though 40 assets / 23 employees might be tight, so let's just reuse some if needed by wrapping around)
      assetIndex = 0;
    }

    // 1. Guaranteed Active Allocation
    await prisma.allocation.create({
      data: {
        assetId: assetRecords[assetIndex].id,
        employeeId: employee.id,
        departmentId: employee.departmentId || depts[0].id,
        expectedReturnDate: getRandomDate(new Date(now.getTime() + 86400000), new Date(now.getTime() + 180 * 86400000)),
        status: "Active"
      }
    });
    await prisma.asset.update({ where: { id: assetRecords[assetIndex].id }, data: { status: "Allocated" } });
    assetIndex++;

    // 2. Guaranteed Overdue Allocation
    await prisma.allocation.create({
      data: {
        assetId: assetRecords[assetIndex].id,
        employeeId: employee.id,
        departmentId: employee.departmentId || depts[0].id,
        expectedReturnDate: getRandomDate(new Date(now.getTime() - 30 * 86400000), new Date(now.getTime() - 86400000)),
        status: "Active" // Active but date is in the past = overdue
      }
    });
    await prisma.asset.update({ where: { id: assetRecords[assetIndex].id }, data: { status: "Allocated" } });
    assetIndex++;

    // 3. Guaranteed Booking
    await prisma.resourceBooking.create({
      data: {
        assetId: assetRecords[assetIndex].id,
        employeeId: employee.id,
        startDate: getRandomDate(new Date(now.getTime() + 86400000), new Date(now.getTime() + 14 * 86400000)),
        endDate: getRandomDate(new Date(now.getTime() + 15 * 86400000), new Date(now.getTime() + 20 * 86400000)),
        status: "Upcoming"
      }
    });
    assetIndex++;

    // 4. Guaranteed Maintenance Ticket
    await prisma.maintenanceRequest.create({
      data: {
        assetId: assetRecords[assetIndex].id,
        employeeId: employee.id,
        description: "Hardware component failure requiring immediate technician assistance.",
        priority: "High",
        status: "Pending"
      }
    });
    assetIndex++;
  }

  // Generate 2 Heavy Audit Cycles
  const auditWeekStart = getRandomDate(new Date(now.getTime() - 7 * 86400000), now);
  const auditWeekEnd = new Date(auditWeekStart.getTime() + 7 * 86400000);

  const cycle1 = await prisma.auditCycle.create({
    data: {
      name: "Global Q3 Hardware Audit",
      startDate: auditWeekStart,
      endDate: auditWeekEnd,
      auditorId: adminOrManager.id,
      status: "Active"
    }
  });

  // Attach 15 assets to the audit
  const auditAssets = [...assetRecords].sort(() => 0.5 - Math.random()).slice(0, 15);
  for (const asset of auditAssets) {
    const isVerified = Math.random() > 0.4;
    const isFlagged = !isVerified && Math.random() > 0.7;
    
    await prisma.auditItem.create({
      data: {
        cycleId: cycle1.id,
        assetId: asset.id,
        status: isFlagged ? "Flagged" : (isVerified ? "Verified" : "Pending"),
        verifiedDate: isVerified ? new Date() : null
      }
    });
  }

  console.log("INTENSE DB Seed Completed! Application is now heavily populated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
