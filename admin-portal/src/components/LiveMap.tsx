"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveBus } from "@/lib/types";

const busIcon = new L.DivIcon({
  className: "",
  html: '<div style="background:#059669;width:12px;height:12px;border-radius:9999px;border:2px solid white;box-shadow:0 0 0 1px #059669"></div>',
  iconSize: [12, 12],
});

const ISLAMABAD_CENTER: [number, number] = [33.6844, 73.0479];

export function LiveMap({ buses }: { buses: LiveBus[] }) {
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
              <p>Driver: {bus.driver?.name ?? "Unassigned"}</p>
              <p>Speed: {bus.location?.speed ?? "-"} km/h</p>
              <p>Crowd: {bus.crowdLevel ?? "Unknown"}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
