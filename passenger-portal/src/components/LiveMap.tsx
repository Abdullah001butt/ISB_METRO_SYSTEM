"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveBus, Station } from "@/lib/types";

const busIcon = new L.DivIcon({
  className: "",
  html: '<div style="background:#059669;width:14px;height:14px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
});

const ISLAMABAD_CENTER: [number, number] = [33.6844, 73.0479];
const ANIMATION_DURATION_MS = 2500;

function popupHtml(bus: LiveBus): string {
  return `
    <div style="font-size:13px">
      <p style="font-weight:600;margin:0 0 2px">${bus.busNumber}</p>
      <p style="margin:0">Route: ${bus.route?.name ?? "Unassigned"}</p>
      <p style="margin:0">Speed: ${bus.location?.speed ?? "-"} km/h</p>
      <p style="margin:0">Crowd: ${bus.crowdLevel ?? "Unknown"}</p>
    </div>
  `;
}

/**
 * Renders (and smoothly animates) one bus marker imperatively via the
 * Leaflet map instance, bypassing react-leaflet's <Marker> position prop —
 * that syncs position instantly on every poll, which reads as the marker
 * "teleporting." This interpolates between old and new positions instead,
 * so the live map reads as genuinely live rather than snapping every few
 * seconds.
 */
function AnimatedBusMarker({ bus }: { bus: LiveBus }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const currentPosRef = useRef<[number, number] | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!bus.location) return;
    const target: [number, number] = [bus.location.latitude, bus.location.longitude];

    if (!markerRef.current) {
      const marker = L.marker(target, { icon: busIcon }).addTo(map);
      marker.bindPopup(popupHtml(bus));
      markerRef.current = marker;
      currentPosRef.current = target;
      return;
    }

    const marker = markerRef.current;
    marker.setPopupContent(popupHtml(bus));

    const start = currentPosRef.current ?? target;
    if (start[0] === target[0] && start[1] === target[1]) return;

    const startTime = performance.now();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    function step(now: number) {
      const t = Math.min((now - startTime) / ANIMATION_DURATION_MS, 1);
      const eased = 1 - (1 - t) * (1 - t); // ease-out
      const lat = start[0] + (target[0] - start[0]) * eased;
      const lng = start[1] + (target[1] - start[1]) * eased;
      marker.setLatLng([lat, lng]);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        currentPosRef.current = target;
      }
    }
    animFrameRef.current = requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bus.location?.latitude, bus.location?.longitude]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (markerRef.current) map.removeLayer(markerRef.current);
    };
     
  }, [map]);

  return null;
}

export function LiveMap({
  buses,
  stations = [],
}: {
  buses: LiveBus[];
  stations?: Station[];
}) {
  const withLocation = buses.filter((b) => b.location);

  return (
    <MapContainer
      center={ISLAMABAD_CENTER}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {stations.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.latitude, s.longitude]}
          radius={5}
          pathOptions={{ color: "#64748b", fillColor: "#94a3b8", fillOpacity: 0.9, weight: 1.5 }}
        >
          <Popup>
            <span className="text-sm font-medium">{s.name}</span>
          </Popup>
        </CircleMarker>
      ))}

      {withLocation.map((bus) => (
        <AnimatedBusMarker key={bus.id} bus={bus} />
      ))}
    </MapContainer>
  );
}
