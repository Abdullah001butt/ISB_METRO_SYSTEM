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
];

const ROUTES = [
  { name: "Red Line", description: "Faizabad to Pakistan Secretariat", stations: ["Faizabad", "Pims Chowk", "Aabpara", "Melody", "Pakistan Secretariat"] },
  { name: "Blue Line", description: "Saddar to 22 No Chungi", stations: ["Saddar", "Karachi Company", "G-9 Markaz", "Melody", "22 No Chungi"] },
];

const DRIVERS = [
  { name: "Imran Sheikh", cnic: "3740112345678", phone: "03215556677" },
  { name: "Bilal Ahmed", cnic: "3520123456789", phone: "03001234567" },
  { name: "Usman Tariq", cnic: "3730198765432", phone: "03339876543" },
];

const BUSES = [
  { busNumber: "MB-101", capacity: 45, driver: "Imran Sheikh", route: "Red Line" },
  { busNumber: "MB-102", capacity: 45, driver: "Bilal Ahmed", route: "Red Line" },
  { busNumber: "MB-201", capacity: 40, driver: "Usman Tariq", route: "Blue Line" },
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
