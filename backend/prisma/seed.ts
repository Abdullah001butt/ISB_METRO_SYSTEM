import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const STATIONS = [
  { name: "Faizabad", latitude: 33.6844, longitude: 73.0479 },
  { name: "Pims Chowk", latitude: 33.701, longitude: 73.051 },
  { name: "Aabpara", latitude: 33.7101, longitude: 73.0865 },
  { name: "Melody", latitude: 33.7139, longitude: 73.0561 },
  { name: "Pakistan Secretariat", latitude: 33.718, longitude: 73.0776 },
  { name: "Saddar", latitude: 33.5983, longitude: 73.0453 },
  { name: "Karachi Company", latitude: 33.6693, longitude: 73.0248 },
  { name: "G-9 Markaz", latitude: 33.6789, longitude: 73.0356 },
  { name: "22 No Chungi", latitude: 33.61, longitude: 73.07 },
  { name: "Khanna Pul", latitude: 33.6478, longitude: 73.1067 },
  { name: "IJP Road", latitude: 33.6295, longitude: 73.0631 },
  { name: "Committee Chowk", latitude: 33.6, longitude: 73.0678 },
  { name: "Zero Point", latitude: 33.7024, longitude: 73.0316 },
  { name: "Golra Mor", latitude: 33.6547, longitude: 72.9714 },
  { name: "Bahria Town Phase 7", latitude: 33.5228, longitude: 73.1266 },
  { name: "Rehmanabad", latitude: 33.5744, longitude: 73.0836 },
  { name: "Shamsabad", latitude: 33.6141, longitude: 73.0819 },
  { name: "Barakahu", latitude: 33.7469, longitude: 73.1275 },
];

const ROUTES = [
  {
    name: "Red Line",
    description: "Faizabad to Pakistan Secretariat",
    stations: ["Faizabad", "Pims Chowk", "Aabpara", "Melody", "Pakistan Secretariat"],
  },
  {
    name: "Blue Line",
    description: "Saddar to 22 No Chungi",
    stations: ["Saddar", "Karachi Company", "G-9 Markaz", "Melody", "22 No Chungi"],
  },
  {
    name: "Green Line",
    description: "Zero Point to Khanna Pul",
    stations: ["Zero Point", "G-9 Markaz", "Aabpara", "Faizabad", "Khanna Pul"],
  },
  {
    name: "Orange Line",
    description: "Golra Mor to Barakahu",
    stations: ["Golra Mor", "IJP Road", "Committee Chowk", "Shamsabad", "Rehmanabad", "Faizabad", "Barakahu"],
  },
  {
    name: "Purple Line",
    description: "Bahria Town to Committee Chowk",
    stations: ["Bahria Town Phase 7", "Rehmanabad", "Shamsabad", "Committee Chowk"],
  },
];

const DRIVERS = [
  { name: "Imran Sheikh", cnic: "3740112345678", phone: "03215556677" },
  { name: "Bilal Ahmed", cnic: "3520123456789", phone: "03001234567" },
  { name: "Usman Tariq", cnic: "3730198765432", phone: "03339876543" },
  { name: "Kashif Mehmood", cnic: "3520145678901", phone: "03011122334" },
  { name: "Nasir Hussain", cnic: "3740156789012", phone: "03335566778" },
  { name: "Waqas Javed", cnic: "3730167890123", phone: "03214455667" },
  { name: "Adeel Raza", cnic: "3520178901234", phone: "03009988776" },
  { name: "Faisal Iqbal", cnic: "3740189012345", phone: "03337766554" },
  { name: "Zeeshan Ali", cnic: "3730190123456", phone: "03219876543" },
  { name: "Hamza Farooq", cnic: "3520101234567", phone: "03003216549" },
];

const BUSES = [
  { busNumber: "MB-101", capacity: 45, driver: "Imran Sheikh", route: "Red Line" },
  { busNumber: "MB-102", capacity: 45, driver: "Bilal Ahmed", route: "Red Line" },
  { busNumber: "MB-103", capacity: 45, driver: "Kashif Mehmood", route: "Red Line" },
  { busNumber: "MB-201", capacity: 40, driver: "Usman Tariq", route: "Blue Line" },
  { busNumber: "MB-202", capacity: 40, driver: "Nasir Hussain", route: "Blue Line" },
  { busNumber: "MB-301", capacity: 45, driver: "Waqas Javed", route: "Green Line" },
  { busNumber: "MB-302", capacity: 45, driver: "Adeel Raza", route: "Green Line" },
  { busNumber: "MB-401", capacity: 40, driver: "Faisal Iqbal", route: "Orange Line" },
  { busNumber: "MB-402", capacity: 40, driver: "Zeeshan Ali", route: "Orange Line" },
  { busNumber: "MB-501", capacity: 35, driver: "Hamza Farooq", route: "Purple Line" },
];

async function resetOperationalData() {
  await prisma.aIPrediction.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.crowdStatus.deleteMany();
  await prisma.gPSLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.busRoute.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.route.deleteMany();
  await prisma.station.deleteMany();
  await prisma.driver.deleteMany();
}

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.admin.upsert({
    where: { email: "admin@metrobus.pk" },
    update: {},
    create: { name: "Default Admin", email: "admin@metrobus.pk", passwordHash },
  });

  console.log("Clearing old operational data (stations, routes, buses, drivers, GPS, alerts)...");
  await resetOperationalData();

  const stationByName = new Map<string, { id: string }>();
  for (const s of STATIONS) {
    const station = await prisma.station.create({ data: s });
    stationByName.set(s.name, station);
  }
  console.log(`Created ${STATIONS.length} stations`);

  const routeByName = new Map<string, { id: string }>();
  for (const r of ROUTES) {
    const route = await prisma.route.create({
      data: {
        name: r.name,
        description: r.description,
        busRoutes: {
          create: r.stations.map((name, index) => ({
            stationId: stationByName.get(name)!.id,
            sequence: index,
          })),
        },
      },
    });
    routeByName.set(r.name, route);
  }
  console.log(`Created ${ROUTES.length} routes`);

  const driverPasswordHash = await bcrypt.hash("driver123", 10);
  const driverByName = new Map<string, { id: string }>();
  for (const d of DRIVERS) {
    const driver = await prisma.driver.create({ data: { ...d, passwordHash: driverPasswordHash } });
    driverByName.set(d.name, driver);
  }
  console.log(`Created ${DRIVERS.length} drivers (password: driver123)`);

  for (const b of BUSES) {
    await prisma.bus.create({
      data: {
        busNumber: b.busNumber,
        capacity: b.capacity,
        driverId: driverByName.get(b.driver)!.id,
        routeId: routeByName.get(b.route)!.id,
      },
    });
  }
  console.log(`Created ${BUSES.length} buses, assigned to drivers and routes`);

  console.log("\nSeed complete.");
  console.log("Admin login: admin@metrobus.pk / admin123");
  console.log("Driver login (any driver CNIC above): password driver123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
