const { buildRouteSegments, positionAtDistance } = require("./geo");
const { FLEET, DRIVER_PASSWORD } = require("./fleet");

const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");
const TICK_MS = Number(process.env.TICK_MS || 20000);
const STALL_PROBABILITY = 0.05;
const CROWD_UPDATE_EVERY_N_TICKS = 6;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The login endpoint is rate-limited to 5/min per IP (brute-force protection).
// Logging in the whole fleet from one IP means spacing requests out and
// backing off on 429 rather than treating it as fatal.
async function driverLogin(cnic, attempt = 1) {
  const res = await fetch(`${BACKEND_URL}/api/driver/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cnic, password: DRIVER_PASSWORD }),
  });

  if (res.status === 429) {
    if (attempt > 5) throw new Error(`login rate-limited too many times for ${cnic}`);
    const backoffMs = 15000 * attempt;
    console.log(`  ${cnic} rate-limited, retrying in ${backoffMs / 1000}s...`);
    await sleep(backoffMs);
    return driverLogin(cnic, attempt + 1);
  }

  if (!res.ok) throw new Error(`login failed for ${cnic}: ${res.status}`);
  return (await res.json()).token;
}

async function getJson(path) {
  const res = await fetch(`${BACKEND_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function postGps(token, busId, latitude, longitude, speed) {
  const res = await fetch(`${BACKEND_URL}/api/gps/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ busId, latitude, longitude, speed }),
  });
  if (!res.ok) throw new Error(`gps update failed (${res.status}): ${await res.text()}`);
}

async function postCrowd(token, busId, level) {
  const res = await fetch(`${BACKEND_URL}/api/crowd/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ busId, level }),
  });
  if (!res.ok) throw new Error(`crowd update failed: ${res.status}`);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

async function buildFleetState() {
  console.log("Logging in fleet drivers...");
  const [busesRes, routesRes] = await Promise.all([getJson("/api/buses"), getJson("/api/routes")]);

  const busByNumber = new Map(busesRes.buses.map((b) => [b.busNumber, b]));
  const routeById = new Map(routesRes.routes.map((r) => [r.id, r]));

  const state = [];

  for (const entry of FLEET) {
    const bus = busByNumber.get(entry.busNumber);
    if (!bus || !bus.routeId) {
      console.warn(`Skipping ${entry.busNumber}: not found or no route assigned`);
      continue;
    }

    const route = routeById.get(bus.routeId);
    if (!route || route.busRoutes.length < 2) {
      console.warn(`Skipping ${entry.busNumber}: route has fewer than 2 stations`);
      continue;
    }

    const stations = route.busRoutes
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map((br) => br.station);

    if (state.length > 0) await sleep(13000); // stay under the 5 logins/min rate limit
    const token = await driverLogin(entry.cnic);
    const routeSegments = buildRouteSegments(stations);

    state.push({
      busNumber: entry.busNumber,
      busId: bus.id,
      token,
      routeName: route.name,
      routeSegments,
      distanceKm: randomBetween(0, routeSegments.totalKm),
      direction: Math.random() < 0.5 ? 1 : -1,
      tickCount: 0,
    });

    console.log(`  ${entry.busNumber} -> ${route.name} (${stations.length} stations, ${routeSegments.totalKm.toFixed(1)}km)`);
  }

  return state;
}

async function tick(bus) {
  bus.tickCount += 1;

  const isStalled = Math.random() < STALL_PROBABILITY;
  const speedKmh = isStalled ? randomBetween(0, 1.5) : randomBetween(14, 32);

  if (!isStalled) {
    const deltaKm = speedKmh * (TICK_MS / 3_600_000) * bus.direction;
    bus.distanceKm += deltaKm;

    if (bus.distanceKm >= bus.routeSegments.totalKm) {
      bus.distanceKm = bus.routeSegments.totalKm;
      bus.direction = -1;
    } else if (bus.distanceKm <= 0) {
      bus.distanceKm = 0;
      bus.direction = 1;
    }
  }

  const { latitude, longitude } = positionAtDistance(bus.routeSegments, bus.distanceKm);
  await postGps(bus.token, bus.busId, latitude, longitude, Number(speedKmh.toFixed(1)));

  if (bus.tickCount % CROWD_UPDATE_EVERY_N_TICKS === 0) {
    const levels = ["LOW", "MEDIUM", "HIGH"];
    await postCrowd(bus.token, bus.busId, levels[Math.floor(Math.random() * levels.length)]);
  }
}

// Buses with a real driver on an active trip stand down here, rather than
// fighting the driver's phone for the same bus's GPS trail — this was
// previously producing physically-impossible jumps in real trip data
// (e.g. a bus "teleporting" between a real phone location and a simulated one).
async function fetchActiveDriverBusIds() {
  try {
    const { busIds } = await getJson("/api/trip/active");
    return new Set(busIds);
  } catch (err) {
    console.error("Failed to fetch active driver trips, simulating all buses this tick:", err.message);
    return new Set();
  }
}

async function runTickForAll(fleetState) {
  const activeDriverBusIds = await fetchActiveDriverBusIds();
  const simulated = fleetState.filter((bus) => !activeDriverBusIds.has(bus.busId));
  const skipped = fleetState.length - simulated.length;

  const results = await Promise.allSettled(simulated.map((bus) => tick(bus)));
  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.error(`${failures.length}/${simulated.length} bus updates failed this tick:`);
    failures.forEach((f) => console.error(`  - ${f.reason?.message ?? f.reason}`));
  } else {
    console.log(
      `Tick ok: ${simulated.length} buses updated` +
        (skipped > 0 ? ` (${skipped} standing down for an active driver)` : "")
    );
  }
}

async function main() {
  const fleetState = await buildFleetState();
  console.log(`\nFleet simulator running: ${fleetState.length} buses, every ${TICK_MS}ms\n`);

  setInterval(() => {
    runTickForAll(fleetState).catch((err) => console.error("Tick loop error:", err.message));
  }, TICK_MS);

  runTickForAll(fleetState).catch((err) => console.error("Initial tick error:", err.message));
}

main().catch((err) => {
  console.error("Fatal error starting fleet simulator:", err.message);
  process.exit(1);
});
