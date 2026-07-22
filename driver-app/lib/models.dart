class Station {
  final String id;
  final String name;

  Station({required this.id, required this.name});

  factory Station.fromJson(Map<String, dynamic> json) {
    return Station(id: json['id'] as String, name: json['name'] as String);
  }
}

class Route {
  final String id;
  final String name;
  final List<Station> stations;

  Route({required this.id, required this.name, this.stations = const []});

  factory Route.fromJson(Map<String, dynamic> json) {
    final busRoutes = json['busRoutes'] as List<dynamic>?;
    return Route(
      id: json['id'] as String,
      name: json['name'] as String,
      stations: busRoutes == null
          ? const []
          : busRoutes
              .map((br) => Station.fromJson(
                  (br as Map<String, dynamic>)['station'] as Map<String, dynamic>))
              .toList(),
    );
  }
}

class Bus {
  final String id;
  final String busNumber;
  final int capacity;
  final bool isActive;
  final Route? route;

  Bus({
    required this.id,
    required this.busNumber,
    required this.capacity,
    required this.isActive,
    required this.route,
  });

  factory Bus.fromJson(Map<String, dynamic> json) {
    return Bus(
      id: json['id'] as String,
      busNumber: json['busNumber'] as String,
      capacity: json['capacity'] as int,
      isActive: json['isActive'] as bool,
      route: json['route'] == null
          ? null
          : Route.fromJson(json['route'] as Map<String, dynamic>),
    );
  }
}

class Trip {
  final String id;
  final String busId;
  final String status;

  Trip({required this.id, required this.busId, required this.status});

  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['id'] as String,
      busId: json['busId'] as String,
      status: json['status'] as String,
    );
  }
}

class DriverAlert {
  final String id;
  final String type;
  final String message;

  DriverAlert({required this.id, required this.type, required this.message});

  factory DriverAlert.fromJson(Map<String, dynamic> json) {
    return DriverAlert(
      id: json['id'] as String,
      type: json['type'] as String,
      message: json['message'] as String,
    );
  }
}

class TripHistoryEntry {
  final String id;
  final String busNumber;
  final String routeName;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final int? durationMinutes;
  final double distanceKm;

  TripHistoryEntry({
    required this.id,
    required this.busNumber,
    required this.routeName,
    required this.startedAt,
    required this.endedAt,
    required this.durationMinutes,
    required this.distanceKm,
  });

  factory TripHistoryEntry.fromJson(Map<String, dynamic> json) {
    return TripHistoryEntry(
      id: json['id'] as String,
      busNumber: json['busNumber'] as String,
      routeName: json['routeName'] as String,
      startedAt: json['startedAt'] == null ? null : DateTime.parse(json['startedAt'] as String),
      endedAt: json['endedAt'] == null ? null : DateTime.parse(json['endedAt'] as String),
      durationMinutes: json['durationMinutes'] as int?,
      distanceKm: (json['distanceKm'] as num).toDouble(),
    );
  }
}

class AdminMessage {
  final String id;
  final String message;
  final DateTime createdAt;

  AdminMessage({required this.id, required this.message, required this.createdAt});

  factory AdminMessage.fromJson(Map<String, dynamic> json) {
    return AdminMessage(
      id: json['id'] as String,
      message: json['message'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class StopRequest {
  final String id;
  final String busId;
  final String stationName;
  final DateTime createdAt;

  StopRequest({
    required this.id,
    required this.busId,
    required this.stationName,
    required this.createdAt,
  });

  factory StopRequest.fromJson(Map<String, dynamic> json) {
    return StopRequest(
      id: json['id'] as String,
      busId: json['busId'] as String,
      stationName: (json['station'] as Map<String, dynamic>)['name'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class Driver {
  final String id;
  final String name;
  final String cnic;
  final String phone;
  final String? email;
  final List<Bus> buses;

  Driver({
    required this.id,
    required this.name,
    required this.cnic,
    required this.phone,
    required this.email,
    required this.buses,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'] as String,
      name: json['name'] as String,
      cnic: json['cnic'] as String,
      phone: json['phone'] as String,
      email: json['email'] as String?,
      buses: (json['buses'] as List<dynamic>)
          .map((b) => Bus.fromJson(b as Map<String, dynamic>))
          .toList(),
    );
  }
}
