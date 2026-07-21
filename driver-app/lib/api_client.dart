import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'models.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

class ApiClient {
  static const baseUrl = 'https://backend-snowy-nu.vercel.app';
  static const _tokenKey = 'driver_token';

  String? _token;

  Future<void> _loadToken() async {
    if (_token != null) return;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
  }

  Future<void> _saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<bool> hasToken() async {
    await _loadToken();
    return _token != null;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  dynamic _decode(http.Response res) {
    final body = jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300) return body;
    final message = body is Map && body['error'] != null
        ? body['error'] as String
        : 'Request failed (${res.statusCode})';
    throw ApiException(message);
  }

  Future<Driver> login(String cnic, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/driver/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'cnic': cnic, 'password': password}),
    );
    final data = _decode(res);
    await _saveToken(data['token'] as String);
    return me();
  }

  Future<Driver> me() async {
    await _loadToken();
    final res = await http.get(
      Uri.parse('$baseUrl/api/driver/me'),
      headers: _headers,
    );
    final data = _decode(res);
    return Driver.fromJson(data['driver'] as Map<String, dynamic>);
  }

  Future<void> postGps({
    required String busId,
    required double latitude,
    required double longitude,
    double? speed,
  }) async {
    await _loadToken();
    final payload = <String, dynamic>{
      'busId': busId,
      'latitude': latitude,
      'longitude': longitude,
    };
    if (speed != null) {
      payload['speed'] = speed;
    }
    final res = await http.post(
      Uri.parse('$baseUrl/api/gps/update'),
      headers: _headers,
      body: jsonEncode(payload),
    );
    _decode(res);
  }

  Future<void> postCrowd({required String busId, required String level}) async {
    await _loadToken();
    final res = await http.post(
      Uri.parse('$baseUrl/api/crowd/update'),
      headers: _headers,
      body: jsonEncode({'busId': busId, 'level': level}),
    );
    _decode(res);
  }

  Future<Trip> startTrip(String busId) async {
    await _loadToken();
    final res = await http.post(
      Uri.parse('$baseUrl/api/trip/start'),
      headers: _headers,
      body: jsonEncode({'busId': busId}),
    );
    final data = _decode(res);
    return Trip.fromJson(data['trip'] as Map<String, dynamic>);
  }

  Future<void> endTrip(String tripId) async {
    await _loadToken();
    final res = await http.post(
      Uri.parse('$baseUrl/api/trip/end'),
      headers: _headers,
      body: jsonEncode({'tripId': tripId}),
    );
    _decode(res);
  }

  Future<void> reportEmergency({required String busId, String? message}) async {
    await _loadToken();
    final payload = <String, dynamic>{'busId': busId};
    if (message != null) {
      payload['message'] = message;
    }
    final res = await http.post(
      Uri.parse('$baseUrl/api/alerts/emergency'),
      headers: _headers,
      body: jsonEncode(payload),
    );
    _decode(res);
  }

  Future<List<DriverAlert>> fetchAlerts(String busId) async {
    await _loadToken();
    final res = await http.get(
      Uri.parse('$baseUrl/api/driver/alerts?busId=$busId'),
      headers: _headers,
    );
    final data = _decode(res);
    return (data['alerts'] as List<dynamic>)
        .map((a) => DriverAlert.fromJson(a as Map<String, dynamic>))
        .toList();
  }
}
