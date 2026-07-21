export type Station = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type BusRouteEntry = {
  id: string;
  sequence: number;
  station: Station;
};

export type Route = {
  id: string;
  name: string;
  description: string | null;
  busRoutes: BusRouteEntry[];
};

export type Driver = {
  id: string;
  name: string;
};

export type Bus = {
  id: string;
  busNumber: string;
  capacity: number;
  isActive: boolean;
  driverId: string | null;
  routeId: string | null;
  driver: Driver | null;
  route: Route | null;
};

export type LiveBus = Bus & {
  location: { latitude: number; longitude: number; speed: number | null; recordedAt: string } | null;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH" | null;
};

export type EtaResponse =
  | {
      busId: string;
      stationId: string;
      etaMinutes: number;
      delayMinutes: number | null;
      source: "ai";
      predictedAt: string;
    }
  | {
      busId: string;
      stationId: string;
      distanceKm: number;
      etaMinutes: number;
      source: "rule-based";
      basedOn: { latitude: number; longitude: number; recordedAt: string };
    };

export type BatchEtaEntry = EtaResponse | { busId: string; stationId: string; etaMinutes: null; source: null };

export type BatchEtaResponse = {
  stationId: string;
  etas: BatchEtaEntry[];
};

export type NearestStation = Station & { distanceKm: number };
