// Mirrors backend/prisma/seed.ts — the fixed driver credentials for the seeded fleet.
// This is intentionally hardcoded: it's simulating fixed onboard devices with known
// credentials, the same way real vehicle telematics units would authenticate.
const DRIVER_PASSWORD = "driver123";

const FLEET = [
  { busNumber: "MB-101", cnic: "3740112345678" },
  { busNumber: "MB-102", cnic: "3520123456789" },
  { busNumber: "MB-103", cnic: "3520145678901" },
  { busNumber: "MB-201", cnic: "3730198765432" },
  { busNumber: "MB-202", cnic: "3740156789012" },
  { busNumber: "MB-301", cnic: "3730167890123" },
  { busNumber: "MB-302", cnic: "3520178901234" },
  { busNumber: "MB-401", cnic: "3740189012345" },
  { busNumber: "MB-402", cnic: "3730190123456" },
  { busNumber: "MB-501", cnic: "3520101234567" },
];

module.exports = { FLEET, DRIVER_PASSWORD };
