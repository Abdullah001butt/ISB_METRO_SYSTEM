class Route {
  final String id;
  final String name;

  Route({required this.id, required this.name});

  factory Route.fromJson(Map<String, dynamic> json) {
    return Route(id: json['id'] as String, name: json['name'] as String);
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
