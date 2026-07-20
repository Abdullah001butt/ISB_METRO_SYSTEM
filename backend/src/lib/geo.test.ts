import { describe, it, expect } from "vitest";
import { haversineDistanceKm, distanceToPolylineKm } from "./geo";

describe("haversineDistanceKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistanceKm(33.6, 73.05, 33.6, 73.05)).toBeCloseTo(0, 5);
  });

  it("returns a sensible distance for two known Islamabad points", () => {
    const d = haversineDistanceKm(33.6, 73.05, 33.68, 73.07);
    expect(d).toBeGreaterThan(8);
    expect(d).toBeLessThan(10);
  });
});

describe("distanceToPolylineKm", () => {
  const stationA = { latitude: 33.6, longitude: 73.05 };
  const stationB = { latitude: 33.62, longitude: 73.05 };

  it("returns null for an empty station list", () => {
    expect(distanceToPolylineKm({ latitude: 33.6, longitude: 73.05 }, [])).toBeNull();
  });

  it("falls back to point distance for a single station", () => {
    const d = distanceToPolylineKm({ latitude: 33.61, longitude: 73.06 }, [stationA]);
    expect(d).not.toBeNull();
    expect(d).toBeGreaterThan(0);
  });

  it("returns ~0 for a point sitting on the route line", () => {
    const onLine = { latitude: 33.61, longitude: 73.05 };
    const d = distanceToPolylineKm(onLine, [stationA, stationB]);
    expect(d).toBeCloseTo(0, 1);
  });

  it("returns a larger distance for a point far off the route line", () => {
    const offLine = { latitude: 33.61, longitude: 73.1 };
    const d = distanceToPolylineKm(offLine, [stationA, stationB]);
    expect(d).not.toBeNull();
    expect(d as number).toBeGreaterThan(4);
  });

  it("clamps to segment endpoints rather than extrapolating the line", () => {
    const beyondB = { latitude: 33.7, longitude: 73.05 };
    const d = distanceToPolylineKm(beyondB, [stationA, stationB]);
    const distToB = haversineDistanceKm(33.7, 73.05, stationB.latitude, stationB.longitude);
    expect(d).toBeCloseTo(distToB, 1);
  });
});
