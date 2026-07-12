import { db as prisma } from "../src/lib/db";
import { hash } from "bcryptjs";

const firstNames = ["Amit", "Sarah", "Michael", "Hannah", "David", "Jessica", "James", "Emily", "Robert", "Olivia", "William", "Sophia", "Richard", "Isabella", "Thomas", "Mia", "Charles", "Charlotte", "Matthew", "Amelia", "Rahul", "Priya", "Vikram", "Sneha", "Arjun"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Sharma", "Patel", "Singh", "Gupta", "Kumar"];

const assetModels = [
  { name: "MacBook Pro 16\"", cost: 2500, category: "Laptops" },
  { name: "MacBook Air M2", cost: 1200, category: "Laptops" },
  { name: "Dell XPS 15", cost: 1800, category: "Laptops" },
  { name: "ThinkPad X1 Carbon", cost: 1600, category: "Laptops" },
  { name: "Dell UltraSharp 27\"", cost: 600, category: "Monitors" },
  { name: "LG 34\" Curved Ultrawide", cost: 800, category: "Monitors" },
  { name: "iPhone 15 Pro", cost: 1000, category: "Mobile Devices" },
  { name: "Samsung Galaxy S23", cost: 900, category: "Mobile Devices" },
  { name: "iPad Pro 12.9", cost: 1100, category: "Mobile Devices" },
  { name: "Herman Miller Aeron", cost: 1200, category: "Furniture" },
  { name: "Steelcase Gesture", cost: 1100, category: "Furniture" },
  { name: "Standing Desk - Uplift", cost: 800, category: "Furniture" },
  { name: "Sony Alpha A7 IV", cost: 2500, category: "Audio/Video", bookable: true },
  { name: "Shure SM7B Microphone", cost: 400, category: "Audio/Video", bookable: true },
  { name: "Epson 4K Projector", cost: 1500, category: "Audio/Video", bookable: true },
  { name: "Tesla Model 3", cost: 45000, category: "Vehicles", bookable: true },
  { name: "Toyota Innova Crysta", cost: 25000, category: "Vehicles", bookable: true },
  { name: "Cisco Meraki Router", cost: 800, category: "Networking" },
  { name: "Logitech MX Master 3", cost: 100, category: "Peripherals" },
  { name: "Keychron K2 Keyboard", cost: 100, category: "Peripherals" },
];

function randomItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("Wiping database...");
  await prisma.$executeRaw`DELETE FROM ActivityLog`;
  await prisma.$executeRaw`DELETE FROM Notification`;
  await prisma.$executeRaw`DELETE FROM AuditItem`;
  await prisma.$executeRaw`DELETE FROM AuditCycle`;
  await prisma.$executeRaw`DELETE FROM MaintenanceRequest`;
  await prisma.$executeRaw`DELETE FROM ResourceBooking`;
  await prisma.$executeRaw`DELETE FROM TransferRequest`;
  await prisma.$executeRaw`DELETE FROM Allocation`;
  await prisma.$executeRaw`DELETE FROM Asset`;
  await prisma.$executeRaw`DELETE FROM AssetCategory`;
  
  await prisma.$executeRaw`UPDATE Employee SET departmentId = NULL`;
  await prisma.$executeRaw`UPDATE Department SET headId = NULL`;
  
  await prisma.$executeRaw`DELETE FROM Employee`;
  await prisma.$executeRaw`DELETE FROM Department`;

  console.log("Seeding Departments...");
  const deptNames = ["Engineering", "IT Support", "Human Resources", "Marketing", "Operations", "Finance"];
  const departments = [];
  for (const name of deptNames) {
    departments.push(await prisma.department.create({ data: { name } }));
  }

  console.log("Seeding Employees...");
  const passwordHash = await hash("password123", 10);
  const employees = [];
  
  // Create Admins (3)
  for (let i = 0; i < 3; i++) {
    const isFirst = i === 0;
    employees.push(await prisma.employee.create({
      data: { 
        name: isFirst ? "Amit Admin" : `${randomItem(firstNames)} ${randomItem(lastNames)}`, 
        email: isFirst ? "admin@assetflow.com" : `admin${i+1}_${Math.random().toString(36).substring(7)}@assetflow.com`, 
        password: passwordHash, 
        role: "Admin", 
        departmentId: departments[1].id 
      }
    }));
  }

  // Create Managers (5)
  for (let i = 0; i < 5; i++) {
    employees.push(await prisma.employee.create({
      data: { 
        name: `${randomItem(firstNames)} ${randomItem(lastNames)}`, 
        email: `manager${i+1}_${Math.random().toString(36).substring(7)}@assetflow.com`, 
        password: passwordHash, 
        role: "AssetManager", 
        departmentId: departments[1].id 
      }
    }));
  }

  // Create Dept Heads (6 - one for each)
  const deptHeads = [];
  for (let i = 0; i < departments.length; i++) {
    const head = await prisma.employee.create({
      data: { 
        name: `${randomItem(firstNames)} ${randomItem(lastNames)}`, 
        email: `head_${departments[i].name.toLowerCase().replace(" ", "")}_${Math.random().toString(36).substring(7)}@assetflow.com`, 
        password: passwordHash, 
        role: "DeptHead", 
        departmentId: departments[i].id 
      }
    });
    employees.push(head);
    deptHeads.push(head);
    await prisma.department.update({ where: { id: departments[i].id }, data: { headId: head.id } });
  }

  // Create regular Employees (30)
  for (let i = 0; i < 30; i++) {
    employees.push(await prisma.employee.create({
      data: { 
        name: `${randomItem(firstNames)} ${randomItem(lastNames)}`, 
        email: `emp${i+1}_${Math.random().toString(36).substring(7)}@assetflow.com`, 
        password: passwordHash, 
        role: "Employee", 
        departmentId: randomItem(departments).id 
      }
    }));
  }

  console.log("Seeding Categories...");
  const categories = {};
  const catNames = [...new Set(assetModels.map(a => a.category))];
  for (const name of catNames) {
    categories[name] = await prisma.assetCategory.create({ data: { name } });
  }

  console.log("Seeding Assets (100 items)...");
  const assets = [];
  let seq = 1000;
  for (let i = 0; i < 100; i++) {
    const model = randomItem(assetModels);
    seq++;
    let status = "Available";
    let rand = Math.random();
    if (rand < 0.5) status = "Allocated";
    else if (rand < 0.6) status = "UnderMaintenance";
    else if (rand < 0.65) status = "Reserved";
    else if (rand < 0.7) status = "Retired";
    
    assets.push(await prisma.asset.create({
      data: {
        tag: `AF-${seq}_${Math.random().toString(36).substring(7)}`,
        name: model.name,
        serialNumber: `SN-${Math.floor(Math.random() * 1000000)}-${Math.random().toString(36).substring(7)}`,
        categoryId: categories[model.category].id,
        acquisitionDate: randomDate(new Date(2022, 0, 1), new Date()),
        acquisitionCost: model.cost * (0.8 + Math.random() * 0.4),
        location: randomItem(["Bangalore HQ", "Mumbai Office", "Delhi Branch", "Remote"]),
        status,
        isBookable: !!model.bookable,
      }
    }));
  }

  console.log("Seeding Allocations...");
  const allocatedAssets = assets.filter(a => a.status === "Allocated");
  for (let i = 0; i < allocatedAssets.length; i++) {
    const isOverdue = Math.random() < 0.2; // 20% overdue
    const allocDate = randomDate(new Date(2025, 0, 1), new Date());
    const expectedReturn = isOverdue ? randomDate(new Date(2025, 1, 1), new Date(Date.now() - 86400000)) : randomDate(new Date(Date.now() + 86400000), new Date(2027, 0, 1));
    
    await prisma.allocation.create({
      data: {
        assetId: allocatedAssets[i].id,
        employeeId: randomItem(employees).id,
        status: isOverdue ? "Overdue" : "Active",
        allocatedDate: allocDate,
        expectedReturnDate: expectedReturn,
      }
    });
  }

  // Add some Historical Allocations (Returned)
  for (let i = 0; i < 15; i++) {
    await prisma.allocation.create({
      data: {
        assetId: randomItem(assets).id,
        employeeId: randomItem(employees).id,
        status: "Returned",
        allocatedDate: new Date(2024, Math.floor(Math.random()*12), 1),
        returnedDate: new Date(2025, Math.floor(Math.random()*12), 1),
      }
    });
  }

  console.log("Seeding Transfer Requests...");
  for (let i = 0; i < 12; i++) {
    await prisma.transferRequest.create({
      data: {
        assetId: randomItem(allocatedAssets).id,
        fromEmployeeId: randomItem(employees).id,
        toEmployeeId: randomItem(employees).id,
        reason: randomItem(["Project reassignment", "Role change", "Hardware upgrade requirement", "Department transfer"]),
        status: "Pending"
      }
    });
  }

  console.log("Seeding Resource Bookings...");
  const bookableAssets = assets.filter(a => a.isBookable);
  for (let i = 0; i < 20; i++) {
    const isPast = Math.random() < 0.3;
    const start = isPast ? randomDate(new Date(Date.now() - 86400000 * 10), new Date(Date.now() - 86400000)) : randomDate(new Date(), new Date(Date.now() + 86400000 * 30));
    const end = new Date(start.getTime() + 86400000 * (1 + Math.random() * 3));
    
    await prisma.resourceBooking.create({
      data: {
        assetId: randomItem(bookableAssets).id,
        employeeId: randomItem(employees).id,
        startDate: start,
        endDate: end,
        status: isPast ? "Completed" : (start < new Date() ? "Ongoing" : "Upcoming")
      }
    });
  }

  console.log("Seeding Maintenance Requests...");
  const maintAssets = assets.filter(a => a.status === "UnderMaintenance");
  for (let i = 0; i < maintAssets.length; i++) {
    await prisma.maintenanceRequest.create({
      data: {
        assetId: maintAssets[i].id,
        employeeId: randomItem(employees).id,
        description: randomItem(["Screen flickering", "Battery draining fast", "Keyboard broken", "Overheating issues"]),
        priority: randomItem(["Low", "Medium", "High", "Critical"]),
        status: "InProgress",
        assignedTechnicianId: randomItem(employees.filter(e => e.role === "AssetManager")).id,
      }
    });
  }
  // Some pending ones
  for (let i = 0; i < 5; i++) {
    await prisma.maintenanceRequest.create({
      data: {
        assetId: randomItem(assets).id,
        employeeId: randomItem(employees).id,
        description: "Routine checkup requested",
        priority: "Low",
        status: "Pending",
      }
    });
  }

  console.log("Seeding Audits...");
  for(let i=0; i<3; i++) {
    const audit = await prisma.auditCycle.create({
      data: {
        name: `202\${4+i} Q\${Math.floor(Math.random()*4)+1} Inventory Check`,
        status: i === 2 ? "Active" : "Closed",
        startDate: new Date(2025, i*3, 1),
        endDate: new Date(2025, i*3, 15),
        auditorId: randomItem(employees.filter(e => e.role === "Admin" || e.role === "AssetManager")).id
      }
    });

    const auditAssets = assets.sort(() => 0.5 - Math.random()).slice(0, 15);
    for(const a of auditAssets) {
      await prisma.auditItem.create({
        data: {
          cycleId: audit.id,
          assetId: a.id,
          status: i === 2 ? randomItem(["Pending", "Verified", "Missing", "Pending", "Pending"]) : randomItem(["Verified", "Missing"])
        }
      });
    }
  }

  console.log("Seeding Activity Logs...");
  const actions = ["RegisterAsset", "UpdateAsset", "AllocateAsset", "ReturnAsset", "CreateMaintenance"];
  for (let i = 0; i < 40; i++) {
    const action = randomItem(actions);
    const asset = randomItem(assets);
    let details = {};
    if (action === "RegisterAsset") details = { before: {}, after: { tag: asset.tag, name: asset.name, cost: asset.acquisitionCost } };
    else if (action === "AllocateAsset") details = { before: { status: "Available" }, after: { status: "Allocated", assignee: randomItem(employees).name } };
    else if (action === "UpdateAsset") details = { before: { condition: "Good" }, after: { condition: "Fair" } };
    else if (action === "ReturnAsset") details = { before: { status: "Allocated" }, after: { status: "Available" } };
    else if (action === "CreateMaintenance") details = { before: {}, after: { issue: "Random issue", priority: "High" } };

    await prisma.activityLog.create({
      data: {
        employee: { connect: { id: randomItem(employees).id } },
        action,
        details: JSON.stringify(details),
        timestamp: randomDate(new Date(Date.now() - 86400000 * 30), new Date())
      }
    });
  }

  console.log("Massive database seed completed successfully! 🚀");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
