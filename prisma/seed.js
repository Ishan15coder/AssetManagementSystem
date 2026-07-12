const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Clear existing database records to ensure clean slate
  await prisma.activityLog.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.resourceBooking.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.department.deleteMany();
  await prisma.employee.deleteMany();

  console.log("Database cleared.");

  // Hash demo password
  const hashedPassword = bcrypt.hashSync("Demo@123", 10);

  // 1. Create Departments
  const deptIT = await prisma.department.create({
    data: { name: "Information Technology", status: "Active" },
  });

  const deptHR = await prisma.department.create({
    data: { name: "Human Resources", status: "Active" },
  });

  const deptFacilities = await prisma.department.create({
    data: { name: "Facilities & Operations", status: "Active" },
  });

  console.log("Departments created.");

  // 2. Create Employees
  const employeeAdmin = await prisma.employee.create({
    data: {
      name: "Sarah Jenkins",
      email: "admin@assetflow.com",
      password: hashedPassword,
      role: "Admin",
      status: "Active",
      departmentId: deptIT.id,
    },
  });

  const employeeManager = await prisma.employee.create({
    data: {
      name: "Marcus Vance",
      email: "manager@assetflow.com",
      password: hashedPassword,
      role: "AssetManager",
      status: "Active",
      departmentId: deptIT.id,
    },
  });

  const employeeHead = await prisma.employee.create({
    data: {
      name: "Elena Rostova",
      email: "elena.it@assetflow.com",
      password: hashedPassword,
      role: "DeptHead",
      status: "Active",
      departmentId: deptIT.id,
    },
  });

  // Assign Elena Rostova as head of IT department
  await prisma.department.update({
    where: { id: deptIT.id },
    data: { headId: employeeHead.id },
  });

  const employeeDavid = await prisma.employee.create({
    data: {
      name: "David Kim",
      email: "david@assetflow.com",
      password: hashedPassword,
      role: "Employee",
      status: "Active",
      departmentId: deptIT.id,
    },
  });

  const employeePriya = await prisma.employee.create({
    data: {
      name: "Priya Patel",
      email: "priya@assetflow.com",
      password: hashedPassword,
      role: "Employee",
      status: "Active",
      departmentId: deptHR.id,
    },
  });

  const employeeRaj = await prisma.employee.create({
    data: {
      name: "Raj Singh",
      email: "raj@assetflow.com",
      password: hashedPassword,
      role: "Employee",
      status: "Active",
      departmentId: deptFacilities.id,
    },
  });

  console.log("Employees created.");

  // 3. Create Asset Categories
  const catElectronics = await prisma.assetCategory.create({
    data: {
      name: "Electronics",
      customFields: JSON.stringify([
        { name: "warrantyMonths", type: "number", label: "Warranty Period (Months)" },
        { name: "processor", type: "text", label: "Processor Model" },
      ]),
    },
  });

  const catFurniture = await prisma.assetCategory.create({
    data: {
      name: "Furniture",
      customFields: JSON.stringify([
        { name: "material", type: "text", label: "Material Type" },
      ]),
    },
  });

  const catVehicles = await prisma.assetCategory.create({
    data: {
      name: "Vehicles",
      customFields: JSON.stringify([
        { name: "licensePlate", type: "text", label: "License Plate Number" },
        { name: "nextServiceMileage", type: "number", label: "Next Service Mileage" },
      ]),
    },
  });

  const catRooms = await prisma.assetCategory.create({
    data: {
      name: "Office Space",
      customFields: JSON.stringify([
        { name: "capacity", type: "number", label: "Room Capacity" },
      ]),
    },
  });

  console.log("Asset categories created.");

  // 4. Create Assets
  const assetLaptop1 = await prisma.asset.create({
    data: {
      tag: "AF-0001",
      name: "MacBook Pro 16-inch",
      serialNumber: "MP16-98725",
      categoryId: catElectronics.id,
      acquisitionDate: new Date("2025-01-10"),
      acquisitionCost: 2499.0,
      condition: "Good",
      location: "HQ - Room 402",
      isBookable: false,
      status: "Allocated",
    },
  });

  const assetLaptop2 = await prisma.asset.create({
    data: {
      tag: "AF-0002",
      name: "Dell Latitude 5420",
      serialNumber: "DL54-11894",
      categoryId: catElectronics.id,
      acquisitionDate: new Date("2025-06-15"),
      acquisitionCost: 1199.0,
      condition: "Good",
      location: "HQ - IT Storage",
      isBookable: false,
      status: "Available",
    },
  });

  const assetChair = await prisma.asset.create({
    data: {
      tag: "AF-0003",
      name: "Ergonomic Desk Chair",
      serialNumber: "EC-99082",
      categoryId: catFurniture.id,
      acquisitionDate: new Date("2024-03-22"),
      acquisitionCost: 350.0,
      condition: "Good",
      location: "HQ - Room 402",
      isBookable: false,
      status: "Allocated",
    },
  });

  const assetCar = await prisma.asset.create({
    data: {
      tag: "AF-0004",
      name: "Company Shuttle Van",
      serialNumber: "VAN-77A23",
      categoryId: catVehicles.id,
      acquisitionDate: new Date("2023-11-05"),
      acquisitionCost: 32000.0,
      condition: "Fair",
      location: "HQ - Main Parking Garage",
      isBookable: true,
      status: "Available",
    },
  });

  const assetRoom = await prisma.asset.create({
    data: {
      tag: "AF-0005",
      name: "Conference Room B2",
      serialNumber: "ROOM-B2",
      categoryId: catRooms.id,
      acquisitionDate: new Date("2022-09-01"),
      acquisitionCost: 0.0, // Fixed physical asset
      condition: "New",
      location: "HQ - Basement Level 2",
      isBookable: true,
      status: "Available",
    },
  });

  const assetProjector = await prisma.asset.create({
    data: {
      tag: "AF-0006",
      name: "4K Overhead Projector",
      serialNumber: "PROJ-4K-2",
      categoryId: catElectronics.id,
      acquisitionDate: new Date("2024-08-14"),
      acquisitionCost: 1500.0,
      condition: "Poor",
      location: "HQ - Room 101",
      isBookable: true,
      status: "UnderMaintenance",
    },
  });

  console.log("Assets created.");

  // 5. Create Allocations
  await prisma.allocation.create({
    data: {
      assetId: assetLaptop1.id,
      employeeId: employeeDavid.id,
      allocatedDate: new Date("2025-01-12"),
      expectedReturnDate: new Date("2026-01-12"),
      status: "Active",
    },
  });

  await prisma.allocation.create({
    data: {
      assetId: assetChair.id,
      employeeId: employeePriya.id,
      allocatedDate: new Date("2024-03-24"),
      expectedReturnDate: new Date("2025-03-24"),
      status: "Overdue", // Past expected date without check-in
    },
  });

  console.log("Allocations created.");

  // 6. Create Resource Bookings
  await prisma.resourceBooking.create({
    data: {
      assetId: assetRoom.id,
      employeeId: employeeDavid.id,
      startDate: new Date("2026-07-12T13:00:00Z"),
      endDate: new Date("2026-07-12T14:30:00Z"),
      status: "Upcoming",
    },
  });

  await prisma.resourceBooking.create({
    data: {
      assetId: assetCar.id,
      employeeId: employeePriya.id,
      startDate: new Date("2026-07-12T09:00:00Z"),
      endDate: new Date("2026-07-12T12:00:00Z"),
      status: "Upcoming",
    },
  });

  console.log("Resource Bookings created.");

  // 7. Create Maintenance Requests
  await prisma.maintenanceRequest.create({
    data: {
      assetId: assetProjector.id,
      employeeId: employeeDavid.id,
      description: "Bulb failed, emitting grinding noise on power up.",
      priority: "High",
      status: "InProgress",
    },
  });

  console.log("Maintenance Requests created.");

  // 8. Create Activity Logs
  await prisma.activityLog.create({
    data: {
      employeeId: employeeAdmin.id,
      action: "PromoteEmployee",
      details: "Promoted Marcus Vance to AssetManager",
      timestamp: new Date("2026-07-12T09:30:00Z"),
    },
  });

  await prisma.activityLog.create({
    data: {
      employeeId: employeeManager.id,
      action: "RegisterAsset",
      details: "Registered Company Shuttle Van (AF-0004)",
      timestamp: new Date("2026-07-12T10:00:00Z"),
    },
  });

  console.log("Activity logs created.");
  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
