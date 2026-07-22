import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as latlong;
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import 'api_client.dart';
import 'auth_provider.dart';
import 'language_provider.dart';
import 'models.dart';
import 'station_detail_screen.dart';
import 'widgets/app_top_bar.dart';

const _islamabadCenter = latlong.LatLng(33.6844, 73.0479);

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Station> _stations = [];
  List<LiveBus> _buses = [];
  Timer? _pollTimer;
  bool _locating = false;
  List<Station>? _nearest;
  String? _locationError;

  @override
  void initState() {
    super.initState();
    _load();
    _pollTimer = Timer.periodic(const Duration(seconds: 8), (_) => _load());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final api = context.read<ApiClient>();
    try {
      final results = await Future.wait([api.fetchStations(), api.fetchLiveBuses()]);
      if (!mounted) return;
      setState(() {
        _stations = results[0] as List<Station>;
        _buses = results[1] as List<LiveBus>;
      });
    } catch (_) {
      // Keep showing the last-known data; next poll retries.
    }
  }

  Future<void> _findNearMe() async {
    final lang = context.read<LanguageProvider>();
    final api = context.read<ApiClient>();
    setState(() {
      _locating = true;
      _locationError = null;
      _nearest = null;
    });
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        setState(() => _locationError = lang.t('locationDenied'));
        return;
      }
      final position = await Geolocator.getCurrentPosition();
      final nearest = await api.fetchNearestStations(position.latitude, position.longitude);
      if (!mounted) return;
      setState(() => _nearest = nearest);
    } catch (_) {
      if (mounted) setState(() => _locationError = lang.t('locationDenied'));
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final auth = context.watch<AuthProvider>();
    final favoriteStations = _stations.where((s) => auth.isFavorite(s.id)).toList();
    final reporting = _buses.where((b) => b.latitude != null).length;

    return Scaffold(
      appBar: AppTopBar(title: lang.t('brandName')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(lang.t('heroTitle'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(lang.t('heroSubtitle'), style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _locating ? null : _findNearMe,
            icon: const Icon(Icons.my_location),
            label: Text(_locating ? lang.t('locating') : lang.t('findNearMe')),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white),
          ),
          if (_locationError != null) ...[
            const SizedBox(height: 8),
            Text(_locationError!, style: const TextStyle(color: Colors.red)),
          ],
          if (_nearest != null && _nearest!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: Text(lang.t('nearestStations'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54)),
                    ),
                    ..._nearest!.map((s) => ListTile(
                          dense: true,
                          leading: const Icon(Icons.location_on, color: Color(0xFF059669), size: 18),
                          title: Text(s.name),
                          trailing: Text('${s.distanceKm?.toStringAsFixed(1)} km ${lang.t('away')}'),
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => StationDetailScreen(station: s)),
                          ),
                        )),
                  ],
                ),
              ),
            ),
          ],
          if (favoriteStations.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: favoriteStations
                  .map((s) => ActionChip(
                        avatar: const Icon(Icons.star, size: 16, color: Colors.amber),
                        label: Text(s.name),
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => StationDetailScreen(station: s)),
                        ),
                      ))
                  .toList(),
            ),
          ],
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.sensors, size: 16, color: Color(0xFF059669)),
                  const SizedBox(width: 6),
                  Text(lang.t('liveBusMap'), style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
              Text('$reporting/${_buses.length} ${lang.t('busesLive')}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 380,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: FlutterMap(
                options: const MapOptions(initialCenter: _islamabadCenter, initialZoom: 12),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.isbmetro.passenger_app',
                  ),
                  MarkerLayer(
                    markers: _stations
                        .map((s) => Marker(
                              point: latlong.LatLng(s.latitude, s.longitude),
                              width: 10,
                              height: 10,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFF94A3B8),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 1.5),
                                ),
                              ),
                            ))
                        .toList(),
                  ),
                  MarkerLayer(
                    markers: _buses
                        .where((b) => b.latitude != null)
                        .map((b) => Marker(
                              point: latlong.LatLng(b.latitude!, b.longitude!),
                              width: 16,
                              height: 16,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFF059669),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                  boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 3)],
                                ),
                              ),
                            ))
                        .toList(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
