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
  await prisma.notification.deleteMany();
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

  const deptFinance = await prisma.department.create({
    data: { name: "Finance & Accounting", status: "Active" },
  });

  const deptMarketing = await prisma.department.create({
    data: { name: "Marketing & Sales", status: "Active" },
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

  const employeeHeadIT = await prisma.employee.create({
    data: {
      name: "Elena Rostova",
      email: "elena.it@assetflow.com",
      password: hashedPassword,
      role: "DeptHead",
      status: "Active",
      departmentId: deptIT.id,
    },
  });

  const employeeHeadHR = await prisma.employee.create({
    data: {
      name: "Priya Patel",
      email: "priya@assetflow.com",
      password: hashedPassword,
      role: "DeptHead",
      status: "Active",
      departmentId: deptHR.id,
    },
  });

  const employeeHeadFacilities = await prisma.employee.create({
    data: {
      name: "Raj Singh",
      email: "raj@assetflow.com",
      password: hashedPassword,
      role: "DeptHead",
      status: "Active",
      departmentId: deptFacilities.id,
    },
  });

  const employeeHeadFinance = await prisma.employee.create({
    data: {
      name: "Diana Prince",
      email: "diana.finance@assetflow.com",
      password: hashedPassword,
      role: "DeptHead",
      status: "Active",
      departmentId: deptFinance.id,
    },
  });

  const employeeHeadMarketing = await prisma.employee.create({
    data: {
      name: "James Bond",
      email: "james.marketing@assetflow.com",
      password: hashedPassword,
      role: "DeptHead",
      status: "Active",
      departmentId: deptMarketing.id,
    },
  });

  // Assign department heads
  await prisma.department.update({ where: { id: deptIT.id }, data: { headId: employeeHeadIT.id } });
  await prisma.department.update({ where: { id: deptHR.id }, data: { headId: employeeHeadHR.id } });
  await prisma.department.update({ where: { id: deptFacilities.id }, data: { headId: employeeHeadFacilities.id } });
  await prisma.department.update({ where: { id: deptFinance.id }, data: { headId: employeeHeadFinance.id } });
  await prisma.department.update({ where: { id: deptMarketing.id }, data: { headId: employeeHeadMarketing.id } });

  // Create Standard Employees
  const employeeDavid = await prisma.employee.create({
    data: { name: "David Kim", email: "david@assetflow.com", password: hashedPassword, role: "Employee", status: "Active", departmentId: deptIT.id },
  });
  const employeeAnna = await prisma.employee.create({
    data: { name: "Anna Kovalenko", email: "anna@assetflow.com", password: hashedPassword, role: "Employee", status: "Active", departmentId: deptHR.id },
  });
  const employeeBruce = await prisma.employee.create({
    data: { name: "Bruce Wayne", email: "bruce@assetflow.com", password: hashedPassword, role: "Employee", status: "Active", departmentId: deptFinance.id },
  });
  const employeeClark = await prisma.employee.create({
    data: { name: "Clark Kent", email: "clark@assetflow.com", password: hashedPassword, role: "Employee", status: "Active", departmentId: deptMarketing.id },
  });
  const employeePeter = await prisma.employee.create({
    data: { name: "Peter Parker", email: "peter@assetflow.com", password: hashedPassword, role: "Employee", status: "Active", departmentId: deptIT.id },
  });
  const employeeTony = await prisma.employee.create({
    data: { name: "Tony Stark", email: "tony@assetflow.com", password: hashedPassword, role: "Employee", status: "Active", departmentId: deptFacilities.id },
  });
  const employeeNatasha = await prisma.employee.create({
    data: { name: "Natasha Romanoff", email: "natasha@assetflow.com", password: hashedPassword, role: "Employee", status: "Active", departmentId: deptFinance.id },
  });
  const employeeSteve = await prisma.employee.create({
    data: { name: "Steve Rogers", email: "steve@assetflow.com", password: hashedPassword, role: "Employee", status: "Active", departmentId: deptMarketing.id },
  });

  console.log("Employees created.");

  // 3. Create Asset Categories
  const catElectronics = await prisma.assetCategory.create({
    data: {
      name: "Electronics",
      customFields: JSON.stringify([
        { name: "warrantyMonths", type: "number", label: "Warranty Period (Months)" },
        { name: "processor", type: "text", label: "Processor Model" },
        { name: "ramGB", type: "number", label: "RAM (GB)" },
      ]),
    },
  });

  const catFurniture = await prisma.assetCategory.create({
    data: {
      name: "Furniture",
      customFields: JSON.stringify([
        { name: "material", type: "text", label: "Material Type" },
        { name: "color", type: "text", label: "Finish / Color" },
      ]),
    },
  });

  const catVehicles = await prisma.assetCategory.create({
    data: {
      name: "Vehicles",
      customFields: JSON.stringify([
        { name: "licensePlate", type: "text", label: "License Plate" },
        { name: "mileage", type: "number", label: "Current Mileage" },
        { name: "nextServiceMileage", type: "number", label: "Next Service Mileage" },
      ]),
    },
  });

  const catRooms = await prisma.assetCategory.create({
    data: {
      name: "Office Space",
      customFields: JSON.stringify([
        { name: "capacity", type: "number", label: "Seating Capacity" },
        { name: "hasAvEquipment", type: "text", label: "AV Setup Present (Yes/No)" },
      ]),
    },
  });

  const catNetwork = await prisma.assetCategory.create({
    data: {
      name: "Network Hardware",
      customFields: JSON.stringify([
        { name: "macAddress", type: "text", label: "MAC Address" },
        { name: "ipAddress", type: "text", label: "Static IP" },
      ]),
    },
  });

  console.log("Asset categories created.");

  // 4. Create Assets
  const assetsData = [
    // Electronics
    { tag: "AF-0001", name: "MacBook Pro 16 M3 Max", serialNumber: "MP16-98725", categoryId: catElectronics.id, acquisitionDate: new Date("2024-01-10"), acquisitionCost: 3499.0, condition: "New", location: "HQ - Room 402", isBookable: false, status: "Allocated" },
    { tag: "AF-0002", name: "Dell Latitude 5420", serialNumber: "DL54-11894", categoryId: catElectronics.id, acquisitionDate: new Date("2023-06-15"), acquisitionCost: 1199.0, condition: "Good", location: "HQ - IT Storage", isBookable: false, status: "Available" },
    { tag: "AF-0003", name: "ThinkPad P1 Gen 6", serialNumber: "TP-P1-00223", categoryId: catElectronics.id, acquisitionDate: new Date("2024-05-18"), acquisitionCost: 2200.0, condition: "New", location: "HQ - Room 403", isBookable: false, status: "Allocated" },
    { tag: "AF-0004", name: "iPad Pro 12.9", serialNumber: "IPAD-9912", categoryId: catElectronics.id, acquisitionDate: new Date("2023-10-05"), acquisitionCost: 1099.0, condition: "Good", location: "HQ - IT Storage", isBookable: true, status: "Available" },
    { tag: "AF-0005", name: "4K Overhead Projector", serialNumber: "PROJ-4K-2", categoryId: catElectronics.id, acquisitionDate: new Date("2021-08-14"), acquisitionCost: 1500.0, condition: "Poor", location: "HQ - Room 101", isBookable: true, status: "UnderMaintenance" },
    { tag: "AF-0006", name: "iPhone 15 Pro", serialNumber: "IPH15-8821", categoryId: catElectronics.id, acquisitionDate: new Date("2023-09-25"), acquisitionCost: 999.0, condition: "Good", location: "HQ - IT Storage", isBookable: false, status: "Available" },

    // Furniture
    { tag: "AF-0007", name: "Ergonomic Desk Chair", serialNumber: "EC-99082", categoryId: catFurniture.id, acquisitionDate: new Date("2022-03-22"), acquisitionCost: 350.0, condition: "Good", location: "HQ - Room 402", isBookable: false, status: "Allocated" },
    { tag: "AF-0008", name: "Executive Mahogany Desk", serialNumber: "ED-00192", categoryId: catFurniture.id, acquisitionDate: new Date("2020-05-12"), acquisitionCost: 1200.0, condition: "Good", location: "HQ - Room 501", isBookable: false, status: "Allocated" },
    { tag: "AF-0009", name: "Standing Desk Frame", serialNumber: "SD-33491", categoryId: catFurniture.id, acquisitionDate: new Date("2024-02-14"), acquisitionCost: 450.0, condition: "New", location: "HQ - Room 402", isBookable: false, status: "Allocated" },
    { tag: "AF-0010", name: "Whiteboard Mobile Stand", serialNumber: "WB-8812", categoryId: catFurniture.id, acquisitionDate: new Date("2023-01-10"), acquisitionCost: 200.0, condition: "Fair", location: "HQ - Lounge Room", isBookable: true, status: "Available" },

    // Vehicles
    { tag: "AF-0011", name: "Company Shuttle Van", serialNumber: "VAN-77A23", categoryId: catVehicles.id, acquisitionDate: new Date("2022-11-05"), acquisitionCost: 32000.0, condition: "Fair", location: "HQ - Main Parking", isBookable: true, status: "Available" },
    { tag: "AF-0012", name: "Tesla Model 3 Executive", serialNumber: "TSLA-M3-44", categoryId: catVehicles.id, acquisitionDate: new Date("2023-04-18"), acquisitionCost: 45000.0, condition: "Good", location: "HQ - Charger Station 1", isBookable: true, status: "Available" },
    { tag: "AF-0013", name: "Delivery Truck Heavy", serialNumber: "TRK-F550-9", categoryId: catVehicles.id, acquisitionDate: new Date("2016-03-01"), acquisitionCost: 65000.0, condition: "Poor", location: "HQ - Loading Dock B", isBookable: true, status: "UnderMaintenance" },

    // Office Space
    { tag: "AF-0014", name: "Conference Room B2", serialNumber: "ROOM-B2", categoryId: catRooms.id, acquisitionDate: new Date("2021-09-01"), acquisitionCost: 0.0, condition: "New", location: "HQ - Basement Level 2", isBookable: true, status: "Available" },
    { tag: "AF-0015", name: "Boardroom Suite 500", serialNumber: "ROOM-500", categoryId: catRooms.id, acquisitionDate: new Date("2021-09-01"), acquisitionCost: 0.0, condition: "Good", location: "HQ - Floor 5", isBookable: true, status: "Available" },
    { tag: "AF-0016", name: "Training Lab Room 102", serialNumber: "ROOM-102", categoryId: catRooms.id, acquisitionDate: new Date("2021-09-01"), acquisitionCost: 0.0, condition: "Fair", location: "HQ - Floor 1", isBookable: true, status: "Available" },
    { tag: "AF-0017", name: "Podcast Recording Studio", serialNumber: "ROOM-POD", categoryId: catRooms.id, acquisitionDate: new Date("2023-08-11"), acquisitionCost: 8500.0, condition: "New", location: "HQ - Floor 3 Annex", isBookable: true, status: "Available" },

    // Network Hardware
    { tag: "AF-0018", name: "Cisco Catalyst 9300 Switch", serialNumber: "CS-9300-X1", categoryId: catNetwork.id, acquisitionDate: new Date("2023-01-20"), acquisitionCost: 4500.0, condition: "Good", location: "Server Room A - Rack 3", isBookable: false, status: "Available" },
    { tag: "AF-0019", name: "Ubiquiti UniFi AP Pro", serialNumber: "UAP-AC-PRO-8", categoryId: catNetwork.id, acquisitionDate: new Date("2022-12-15"), acquisitionCost: 250.0, condition: "Good", location: "Lobby Ceilings", isBookable: false, status: "Available" },
    { tag: "AF-0020", name: "Fortinet FireWall 100F", serialNumber: "FTNT-100F-Y2", categoryId: catNetwork.id, acquisitionDate: new Date("2023-03-10"), acquisitionCost: 3500.0, condition: "Good", location: "Server Room A - Rack 1", isBookable: false, status: "Available" },

    // Assets nearing retirement (varying dates to trigger forecast analytics)
    { tag: "AF-0021", name: "Lenovo ThinkPad X1 Carbon (Legacy)", serialNumber: "TP-X1-LEGACY", categoryId: catElectronics.id, acquisitionDate: new Date("2023-08-01"), acquisitionCost: 1800.0, condition: "Fair", location: "HQ - Room 402", isBookable: false, status: "Allocated" }, // Expires soon (36m limit)
    { tag: "AF-0022", name: "Conference Table Wood Oak (Legacy)", serialNumber: "CT-OAK-LEGACY", categoryId: catFurniture.id, acquisitionDate: new Date("2019-09-01"), acquisitionCost: 3500.0, condition: "Fair", location: "HQ - Floor 2 Meeting", isBookable: false, status: "Allocated" }, // Expires soon (84m limit)
    { tag: "AF-0023", name: "Security Gate Server Terminal", serialNumber: "SVR-GATE-T1", categoryId: catNetwork.id, acquisitionDate: new Date("2021-08-01"), acquisitionCost: 8000.0, condition: "Fair", location: "Main Lobby Desk", isBookable: false, status: "Available" },
  ];

  const dbAssets = [];
  for (const a of assetsData) {
    const asset = await prisma.asset.create({ data: a });
    dbAssets.push(asset);
  }
  console.log("Assets created.");

  // Map created assets helper
  const getAsset = (tag) => dbAssets.find((a) => a.tag === tag);

  // 5. Create Allocations
  const allocation1 = await prisma.allocation.create({
    data: {
      assetId: getAsset("AF-0001").id,
      employeeId: employeeDavid.id,
      allocatedDate: new Date("2024-01-12"),
      expectedReturnDate: new Date("2025-01-12"),
      status: "Active",
    },
  });

  const allocation2 = await prisma.allocation.create({
    data: {
      assetId: getAsset("AF-0003").id,
      employeeId: employeePeter.id,
      allocatedDate: new Date("2024-05-20"),
      expectedReturnDate: new Date("2025-05-20"),
      status: "Active",
    },
  });

  const allocation3 = await prisma.allocation.create({
    data: {
      assetId: getAsset("AF-0007").id,
      employeeId: employeeAnna.id,
      allocatedDate: new Date("2022-03-24"),
      expectedReturnDate: new Date("2023-03-24"),
      status: "Overdue", // Past expected date without check-in
    },
  });

  const allocation4 = await prisma.allocation.create({
    data: {
      assetId: getAsset("AF-0008").id,
      employeeId: employeeBruce.id,
      allocatedDate: new Date("2020-05-15"),
      expectedReturnDate: new Date("2025-05-15"),
      status: "Active",
    },
  });

  const allocation5 = await prisma.allocation.create({
    data: {
      assetId: getAsset("AF-0009").id,
      employeeId: employeeClark.id,
      allocatedDate: new Date("2024-02-15"),
      expectedReturnDate: new Date("2025-02-15"),
      status: "Active",
    },
  });

  const allocation6 = await prisma.allocation.create({
    data: {
      assetId: getAsset("AF-0021").id,
      employeeId: employeeSteve.id,
      allocatedDate: new Date("2023-08-05"),
      expectedReturnDate: new Date("2026-08-05"),
      status: "Active",
    },
  });

  const allocation7 = await prisma.allocation.create({
    data: {
      assetId: getAsset("AF-0022").id,
      employeeId: employeeNatasha.id,
      allocatedDate: new Date("2019-09-05"),
      expectedReturnDate: new Date("2026-09-05"),
      status: "Active",
    },
  });

  console.log("Allocations created.");

  // 6. Create Resource Bookings (To generate a beautiful heatmap distribution)
  const bookingsData = [
    // Today bookings at varying hours to populate hourly heatmap
    { tag: "AF-0014", emp: employeeDavid, hourStart: 9, hourEnd: 10, status: "Completed" },
    { tag: "AF-0014", emp: employeeAnna, hourStart: 9, hourEnd: 11, status: "Completed" },
    { tag: "AF-0014", emp: employeeBruce, hourStart: 10, hourEnd: 12, status: "Completed" },
    { tag: "AF-0014", emp: employeeClark, hourStart: 14, hourEnd: 15, status: "Completed" },
    { tag: "AF-0014", emp: employeePeter, hourStart: 14, hourEnd: 16, status: "Completed" },
    { tag: "AF-0014", emp: employeeTony, hourStart: 15, hourEnd: 16, status: "Completed" },
    { tag: "AF-0014", emp: employeeNatasha, hourStart: 15, hourEnd: 17, status: "Completed" },
    { tag: "AF-0014", emp: employeeSteve, hourStart: 16, hourEnd: 18, status: "Completed" },
    
    // Conference Room 500 bookings
    { tag: "AF-0015", emp: employeeBruce, hourStart: 11, hourEnd: 12, status: "Completed" },
    { tag: "AF-0015", emp: employeeClark, hourStart: 11, hourEnd: 13, status: "Completed" },
    { tag: "AF-0015", emp: employeeTony, hourStart: 14, hourEnd: 15, status: "Completed" },
    { tag: "AF-0015", emp: employeeNatasha, hourStart: 17, hourEnd: 19, status: "Upcoming" },

    // Vehicle bookings
    { tag: "AF-0011", emp: employeeTony, hourStart: 8, hourEnd: 12, status: "Completed" },
    { tag: "AF-0012", emp: employeeSteve, hourStart: 13, hourEnd: 17, status: "Ongoing" },
    { tag: "AF-0011", emp: employeeBruce, hourStart: 18, hourEnd: 21, status: "Upcoming" },
  ];

  for (const b of bookingsData) {
    const asset = getAsset(b.tag);
    const start = new Date();
    start.setUTCHours(b.hourStart, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(b.hourEnd, 0, 0, 0);

    await prisma.resourceBooking.create({
      data: {
        assetId: asset.id,
        employeeId: b.emp.id,
        startDate: start,
        endDate: end,
        status: b.status,
      },
    });
  }

  console.log("Resource Bookings created.");

  // 7. Create Maintenance Requests
  await prisma.maintenanceRequest.create({
    data: {
      assetId: getAsset("AF-0005").id,
      employeeId: employeeDavid.id,
      description: "Overhead projector bulb blew. Emits a high-pitched click on startup.",
      priority: "High",
      status: "InProgress",
      assignedTechnicianId: employeeTony.id,
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: getAsset("AF-0013").id,
      employeeId: employeeTony.id,
      description: "Squeaking transmission when backing up. Safety check needed.",
      priority: "Critical",
      status: "Pending",
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: getAsset("AF-0018").id,
      employeeId: employeePeter.id,
      description: "Switch fan running at 100% capacity constant speed. Overheating warning.",
      priority: "Medium",
      status: "Approved",
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: getAsset("AF-0002").id,
      employeeId: employeeAnna.id,
      description: "Reinstall factory OS configuration and wipe profile details.",
      priority: "Low",
      status: "Resolved",
      resolutionNotes: "Performed zero-fill overwrite. Installed latest corporate Windows 11 Enterprise image successfully.",
      assignedTechnicianId: employeeDavid.id,
    },
  });

  console.log("Maintenance Requests created.");

  // 8. Create Transfer Requests
  await prisma.transferRequest.create({
    data: {
      assetId: getAsset("AF-0001").id,
      fromEmployeeId: employeeDavid.id,
      toEmployeeId: employeePeter.id,
      status: "Pending",
      reason: "Department project requirement",
    },
  });

  await prisma.transferRequest.create({
    data: {
      assetId: getAsset("AF-0007").id,
      fromEmployeeId: employeeAnna.id,
      toEmployeeId: employeeNatasha.id,
      status: "Pending",
      reason: "Medical ergonomics recommendation",
    },
  });

  console.log("Transfer Requests created.");

  // 9. Create Notifications
  const notificationsData = [
    { emp: employeeDavid, type: "Info", msg: "Your resource booking for Conference Room B2 has been confirmed." },
    { emp: employeeAdmin, type: "Warning", msg: "Marcus Vance has raised a high-priority maintenance ticket for the Delivery Truck Heavy." },
    { emp: employeeHeadIT, type: "Alert", msg: "New transfer request pending approval: MacBook Pro 16 M3 Max requested by Peter Parker." },
    { emp: employeeAnna, type: "Alert", msg: "Overdue Return: Your Ergo Chair assignment is past its return window. Please return to Facilities." },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({
      data: {
        employeeId: n.emp.id,
        type: n.type,
        message: n.msg,
        isRead: false,
      },
    });
  }

  console.log("Notifications seeded.");

  // 10. Create Audit Cycles
  const auditCycleActive = await prisma.auditCycle.create({
    data: {
      name: "Q3 Corporate Infrastructure Audit",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-31"),
      auditorId: employeeManager.id,
      status: "Active",
    },
  });

  // Add items to active audit cycle
  const auditAssets = [getAsset("AF-0001"), getAsset("AF-0002"), getAsset("AF-0003"), getAsset("AF-0007"), getAsset("AF-0018")];
  const auditStatuses = ["Verified", "Pending", "Verified", "Damaged", "Missing"];

  for (let i = 0; i < auditAssets.length; i++) {
    await prisma.auditItem.create({
      data: {
        cycleId: auditCycleActive.id,
        assetId: auditAssets[i].id,
        status: auditStatuses[i],
      },
    });
  }

  const auditCycleClosed = await prisma.auditCycle.create({
    data: {
      name: "2025 EOY Asset Inventory Check",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-28"),
      auditorId: employeeAdmin.id,
      status: "Closed",
    },
  });

  await prisma.auditItem.create({
    data: {
      cycleId: auditCycleClosed.id,
      assetId: getAsset("AF-0004").id,
      status: "Verified",
    },
  });

  console.log("Audit cycles and items created.");

  // 11. Create Activity Logs
  await prisma.activityLog.create({
    data: {
      employeeId: employeeAdmin.id,
      action: "PromoteEmployee",
      details: "Promoted Sarah Jenkins to Head of IT Department",
      timestamp: new Date("2026-07-12T09:30:00Z"),
    },
  });

  await prisma.activityLog.create({
    data: {
      employeeId: employeeManager.id,
      action: "RegisterAsset",
      details: "Registered Fortinet FireWall 100F (AF-0020)",
      timestamp: new Date("2026-07-12T10:00:00Z"),
    },
  });

  await prisma.activityLog.create({
    data: {
      employeeId: employeeHeadIT.id,
      action: "RaiseMaintenance",
      details: "Raised high-priority maintenance ticket for Projector (AF-0005)",
      timestamp: new Date("2026-07-12T10:30:00Z"),
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
