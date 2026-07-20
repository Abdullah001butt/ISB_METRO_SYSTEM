const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

type LatLon = { latitude: number; longitude: number };

/** Flat-earth projection to local km-based coordinates. Fine for city-scale distances. */
function toLocalXY(point: LatLon, refLat: number): { x: number; y: number } {
  const kmPerDegLat = 111.32;
  const kmPerDegLon = 111.32 * Math.cos(toRadians(refLat));
  return { x: point.longitude * kmPerDegLon, y: point.latitude * kmPerDegLat };
}

function pointToSegmentDistanceKm(point: LatLon, segStart: LatLon, segEnd: LatLon): number {
  const refLat = point.latitude;
  const p = toLocalXY(point, refLat);
  const a = toLocalXY(segStart, refLat);
  const b = toLocalXY(segEnd, refLat);

  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSq = abx * abx + aby * aby;

  let t = lengthSq === 0 ? 0 : ((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const closest = { x: a.x + t * abx, y: a.y + t * aby };
  return Math.hypot(p.x - closest.x, p.y - closest.y);
}

/** Minimum distance from a point to the polyline formed by an ordered list of stations. */
export function distanceToPolylineKm(point: LatLon, stations: LatLon[]): number | null {
  if (stations.length === 0) return null;
  if (stations.length === 1) {
    return haversineDistanceKm(
      point.latitude,
      point.longitude,
      stations[0].latitude,
      stations[0].longitude
    );
  }

  let min = Infinity;
  for (let i = 0; i < stations.length - 1; i++) {
    const d = pointToSegmentDistanceKm(point, stations[i], stations[i + 1]);
    if (d < min) min = d;
  }
  return min;
}
