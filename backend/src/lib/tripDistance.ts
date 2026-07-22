import { haversineDistanceKm } from "./geo";

// Guards against GPS points that can't reflect real bus movement — e.g. a
// fleet-simulator process still driving the same bus in parallel with a real
// driver's phone, which produces huge instantaneous jumps between the two
// sources. Anything implying a speed above this is treated as a data glitch,
// not travel, and excluded from the distance sum.
export const MAX_PLAUSIBLE_SPEED_KMH = 140;

export type TripPoint = { latitude: number; longitude: number; recordedAt: Date };

export function computeTripDistanceKm(points: TripPoint[]): number {
  let distanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    const segmentKm = haversineDistanceKm(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
    const hours = (points[i].recordedAt.getTime() - points[i - 1].recordedAt.getTime()) / 3_600_000;
    const impliedSpeedKmh = hours > 0 ? segmentKm / hours : Infinity;
    if (impliedSpeedKmh <= MAX_PLAUSIBLE_SPEED_KMH) {
      distanceKm += segmentKm;
    }
  }
  return distanceKm;
}
