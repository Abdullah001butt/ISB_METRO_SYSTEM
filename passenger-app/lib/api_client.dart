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
  static const _tokenKey = 'passenger_token';

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

  // ---- Auth ----

  Future<Passenger> register(String name, String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/passenger/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    final data = _decode(res);
    await _saveToken(data['token'] as String);
    return Passenger.fromJson(data['passenger'] as Map<String, dynamic>);
  }

  Future<Passenger> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/passenger/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = _decode(res);
    await _saveToken(data['token'] as String);
    return Passenger.fromJson(data['passenger'] as Map<String, dynamic>);
  }

  Future<Passenger> me() async {
    await _loadToken();
    final res = await http.get(Uri.parse('$baseUrl/api/passenger/me'), headers: _headers);
    final data = _decode(res);
    return Passenger.fromJson(data['passenger'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    await _loadToken();
    try {
      await http.post(Uri.parse('$baseUrl/api/auth/logout'), headers: _headers);
    } catch (_) {
      // Best-effort — token is discarded client-side regardless.
    }
  }

  // ---- Public data ----

  Future<List<Station>> fetchStations() async {
    final res = await http.get(Uri.parse('$baseUrl/api/stations'));
    final data = _decode(res);
    return (data['stations'] as List<dynamic>)
        .map((s) => Station.fromJson(s as Map<String, dynamic>))
        .toList();
  }

  Future<List<BusRoute>> fetchRoutes() async {
    final res = await http.get(Uri.parse('$baseUrl/api/routes'));
    final data = _decode(res);
    return (data['routes'] as List<dynamic>)
        .map((r) => BusRoute.fromJson(r as Map<String, dynamic>))
        .toList();
  }

  Future<List<LiveBus>> fetchLiveBuses() async {
    final res = await http.get(Uri.parse('$baseUrl/api/live-buses'));
    final data = _decode(res);
    return (data['buses'] as List<dynamic>)
        .map((b) => LiveBus.fromJson(b as Map<String, dynamic>))
        .toList();
  }

  Future<List<Station>> fetchNearestStations(double lat, double lon, {int limit = 5}) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/stations/nearest?lat=$lat&lon=$lon&limit=$limit'),
    );
    final data = _decode(res);
    return (data['stations'] as List<dynamic>)
        .map((s) => Station.fromJson(s as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, BatchEtaEntry>> fetchBatchEta(String stationId, List<String> busIds) async {
    if (busIds.isEmpty) return {};
    final res = await http.get(
      Uri.parse('$baseUrl/api/eta/batch?stationId=$stationId&busIds=${busIds.join(",")}'),
    );
    final data = _decode(res);
    final etas = (data['etas'] as List<dynamic>).map((e) => BatchEtaEntry.fromJson(e as Map<String, dynamic>));
    return {for (final e in etas) e.busId: e};
  }

  // ---- Favorites (server-synced, requires login) ----

  Future<List<Station>> fetchFavorites() async {
    await _loadToken();
    final res = await http.get(Uri.parse('$baseUrl/api/passenger/favorites'), headers: _headers);
    final data = _decode(res);
    return (data['stations'] as List<dynamic>)
        .map((s) => Station.fromJson(s as Map<String, dynamic>))
        .toList();
  }

  Future<void> addFavorite(String stationId) async {
    await _loadToken();
    final res = await http.post(
      Uri.parse('$baseUrl/api/passenger/favorites'),
      headers: _headers,
      body: jsonEncode({'stationId': stationId}),
    );
    _decode(res);
  }

  Future<void> removeFavorite(String stationId) async {
    await _loadToken();
    final res = await http.delete(
      Uri.parse('$baseUrl/api/passenger/favorites'),
      headers: _headers,
      body: jsonEncode({'stationId': stationId}),
    );
    _decode(res);
  }

  // ---- Stop requests (Ride Mode) ----

  Future<StopRequestStatus> requestStop({required String busId, required String stationId}) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/stop-requests'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'busId': busId, 'stationId': stationId}),
    );
    final data = _decode(res);
    return StopRequestStatus.fromJson(data['stopRequest'] as Map<String, dynamic>);
  }

  Future<StopRequestStatus> fetchStopRequestStatus(String id) async {
    final res = await http.get(Uri.parse('$baseUrl/api/stop-requests/$id'));
    final data = _decode(res);
    return StopRequestStatus.fromJson(data['stopRequest'] as Map<String, dynamic>);
  }
}
