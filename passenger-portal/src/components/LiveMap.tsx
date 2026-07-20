"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveBus, Station } from "@/lib/types";

const busIcon = new L.DivIcon({
  className: "",
  html: '<div style="background:#059669;width:14px;height:14px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
});

const ISLAMABAD_CENTER: [number, number] = [33.6844, 73.0479];

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
        <Marker
          key={bus.id}
          position={[bus.location!.latitude, bus.location!.longitude]}
          icon={busIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{bus.busNumber}</p>
              <p>Route: {bus.route?.name ?? "Unassigned"}</p>
              <p>Speed: {bus.location?.speed ?? "-"} km/h</p>
              <p>Crowd: {bus.crowdLevel ?? "Unknown"}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
