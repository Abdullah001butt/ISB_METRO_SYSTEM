import { describe, it, expect } from "vitest";
import { computeTripDistanceKm } from "./tripDistance";

const ISLAMABAD = { latitude: 33.6844, longitude: 73.0479 };
const ISLAMABAD_NEARBY = { latitude: 33.694, longitude: 73.0479 }; // ~1.06km north
const DUBAI = { latitude: 25.2048, longitude: 55.2708 }; // ~1900km away

function at(point: { latitude: number; longitude: number }, secondsFromStart: number) {
  return { ...point, recordedAt: new Date(secondsFromStart * 1000) };
}

describe("computeTripDistanceKm", () => {
  it("returns 0 for fewer than two points", () => {
    expect(computeTripDistanceKm([])).toBe(0);
    expect(computeTripDistanceKm([at(ISLAMABAD, 0)])).toBe(0);
  });

  it("sums realistic consecutive movement", () => {
    const points = [at(ISLAMABAD, 0), at(ISLAMABAD_NEARBY, 120)];
    // ~1.06km in 2 minutes ≈ 32km/h — plausible, should be counted.
    expect(computeTripDistanceKm(points)).toBeCloseTo(1.06, 1);
  });

  it("excludes a physically-impossible jump between two GPS sources", () => {
    // Real bug: a fleet simulator and a real driver's phone both posting for
    // the same bus produced a ~1900km jump in under a minute.
    const points = [at(ISLAMABAD, 0), at(DUBAI, 45)];
    expect(computeTripDistanceKm(points)).toBe(0);
  });

  it("keeps plausible segments while dropping only the implausible one", () => {
    const points = [at(ISLAMABAD, 0), at(ISLAMABAD_NEARBY, 120), at(DUBAI, 165), at(DUBAI, 285)];
    // Segment 1 (Islamabad -> nearby) is plausible and counted; segment 2
    // (nearby -> Dubai) is not; segment 3 (Dubai -> Dubai, stationary) adds 0.
    expect(computeTripDistanceKm(points)).toBeCloseTo(1.06, 1);
  });
});
