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
  cnic: string;
  phone: string;
  email: string | null;
  isActive: boolean;
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

export type Alert = {
  id: string;
  busId: string | null;
  type: "DELAY" | "ROUTE_DEVIATION" | "BREAKDOWN" | "EMERGENCY" | "OTHER";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  message: string;
  photoDataUrl: string | null;
  createdAt: string;
  resolvedAt: string | null;
  bus: Bus | null;
};

export type AIPrediction = {
  id: string;
  busId: string;
  stationId: string | null;
  predictedEtaMinutes: number | null;
  predictedDelayMinutes: number | null;
  createdAt: string;
};

export type GpsLogEntry = {
  id: string;
  busId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  recordedAt: string;
};

export type RouteAnalytics = {
  routeId: string;
  routeName: string;
  onTimePercentage: number | null;
  avgDelayMinutes: number | null;
  sampleCount: number;
  speedByHour: { hour: number; avgSpeedKmh: number; sampleCount: number }[];
};

export type PublicAlert = {
  id: string;
  type: "DELAY" | "ROUTE_DEVIATION" | "BREAKDOWN" | "EMERGENCY" | "OTHER";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  message: string;
  createdAt: string;
  bus: { busNumber: string } | null;
};

export type DriverPerformance = {
  driverId: string;
  driverName: string;
  isActive: boolean;
  tripsCompleted: number;
  totalDurationMinutes: number;
  alertCount: number;
};

export type AlertAnalytics = {
  lookbackDays: number;
  currentlyOpen: number;
  daily: { day: string; type: string; count: number }[];
  byRoute: { routeId: string | null; routeName: string; type: string; count: number }[];
  resolution: { type: string; avgResolutionMinutes: number | null; resolvedCount: number }[];
};

export type ActivityLog = {
  id: string;
  adminId: string | null;
  admin: { id: string; name: string; email: string } | null;
  action: string;
  details: string | null;
  createdAt: string;
};
