const EARTH_RADIUS_KM = 6371;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Builds a list of {fromKm, toKm, station} cumulative-distance segments for
 * an ordered list of stations, so a scalar "distance traveled" can be turned
 * back into a lat/lon by walking the polyline.
 */
function buildRouteSegments(stations) {
  const segments = [];
  let cumulativeKm = 0;

  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i];
    const b = stations[i + 1];
    const km = haversineDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
    segments.push({ fromKm: cumulativeKm, toKm: cumulativeKm + km, a, b });
    cumulativeKm += km;
  }

  return { segments, totalKm: cumulativeKm };
}

/** Given a distance along the route, interpolate the current lat/lon. */
function positionAtDistance(routeSegments, distanceKm) {
  const clamped = Math.max(0, Math.min(distanceKm, routeSegments.totalKm));

  for (const seg of routeSegments.segments) {
    if (clamped >= seg.fromKm && clamped <= seg.toKm) {
      const segLength = seg.toKm - seg.fromKm;
      const t = segLength === 0 ? 0 : (clamped - seg.fromKm) / segLength;
      return {
        latitude: seg.a.latitude + (seg.b.latitude - seg.a.latitude) * t,
        longitude: seg.a.longitude + (seg.b.longitude - seg.a.longitude) * t,
      };
    }
  }

  const last = routeSegments.segments[routeSegments.segments.length - 1];
  return { latitude: last.b.latitude, longitude: last.b.longitude };
}

module.exports = { haversineDistanceKm, buildRouteSegments, positionAtDistance };
