class Station {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final double? distanceKm;

  Station({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.distanceKm,
  });

  factory Station.fromJson(Map<String, dynamic> json) {
    return Station(
      id: json['id'] as String,
      name: json['name'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      distanceKm: json['distanceKm'] != null ? (json['distanceKm'] as num).toDouble() : null,
    );
  }
}

class BusRouteEntry {
  final int sequence;
  final Station station;

  BusRouteEntry({required this.sequence, required this.station});

  factory BusRouteEntry.fromJson(Map<String, dynamic> json) {
    return BusRouteEntry(
      sequence: json['sequence'] as int,
      station: Station.fromJson(json['station'] as Map<String, dynamic>),
    );
  }
}

class BusRoute {
  final String id;
  final String name;
  final String? description;
  final List<BusRouteEntry> busRoutes;

  BusRoute({required this.id, required this.name, required this.description, required this.busRoutes});

  factory BusRoute.fromJson(Map<String, dynamic> json) {
    return BusRoute(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      busRoutes: (json['busRoutes'] as List<dynamic>)
          .map((b) => BusRouteEntry.fromJson(b as Map<String, dynamic>))
          .toList(),
    );
  }
}

class LiveBus {
  final String id;
  final String busNumber;
  final int capacity;
  final String? routeId;
  final String? routeName;
  final double? latitude;
  final double? longitude;
  final double? speed;
  final String? crowdLevel;

  LiveBus({
    required this.id,
    required this.busNumber,
    required this.capacity,
    required this.routeId,
    required this.routeName,
    required this.latitude,
    required this.longitude,
    required this.speed,
    required this.crowdLevel,
  });

  factory LiveBus.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>?;
    final route = json['route'] as Map<String, dynamic>?;
    return LiveBus(
      id: json['id'] as String,
      busNumber: json['busNumber'] as String,
      capacity: json['capacity'] as int,
      routeId: json['routeId'] as String?,
      routeName: route?['name'] as String?,
      latitude: location != null ? (location['latitude'] as num).toDouble() : null,
      longitude: location != null ? (location['longitude'] as num).toDouble() : null,
      speed: location?['speed'] != null ? (location!['speed'] as num).toDouble() : null,
      crowdLevel: json['crowdLevel'] as String?,
    );
  }
}

class BatchEtaEntry {
  final String busId;
  final double? etaMinutes;
  final String? source;

  BatchEtaEntry({required this.busId, required this.etaMinutes, required this.source});

  factory BatchEtaEntry.fromJson(Map<String, dynamic> json) {
    return BatchEtaEntry(
      busId: json['busId'] as String,
      etaMinutes: json['etaMinutes'] != null ? (json['etaMinutes'] as num).toDouble() : null,
      source: json['source'] as String?,
    );
  }
}

class StopRequestStatus {
  final String id;
  final String status;
  final String? driverReply;

  StopRequestStatus({required this.id, required this.status, this.driverReply});

  bool get isAcknowledged => status == 'ACKNOWLEDGED';

  factory StopRequestStatus.fromJson(Map<String, dynamic> json) {
    return StopRequestStatus(
      id: json['id'] as String,
      status: json['status'] as String,
      driverReply: json['driverReply'] as String?,
    );
  }
}

class Passenger {
  final String id;
  final String name;
  final String email;

  Passenger({required this.id, required this.name, required this.email});

  factory Passenger.fromJson(Map<String, dynamic> json) {
    return Passenger(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
    );
  }
}
