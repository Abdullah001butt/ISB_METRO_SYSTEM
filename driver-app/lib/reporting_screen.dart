import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';
import 'background_service.dart';
import 'models.dart';

class ReportingScreen extends StatefulWidget {
  final ApiClient api;
  final Bus bus;
  const ReportingScreen({super.key, required this.api, required this.bus});

  @override
  State<ReportingScreen> createState() => _ReportingScreenState();
}

class _ReportingScreenState extends State<ReportingScreen> {
  bool _onTrip = false;
  bool _busy = false;
  String _status = 'Tap "Start Trip" to begin sharing your live location.';
  Trip? _activeTrip;
  int _updatesSent = 0;
  double? _lastLat;
  double? _lastLng;
  String _crowdLevel = 'LOW';
  StreamSubscription<Map<String, dynamic>?>? _serviceSub;
  Timer? _alertTimer;
  List<DriverAlert> _alerts = [];

  @override
  void dispose() {
    _serviceSub?.cancel();
    _alertTimer?.cancel();
    super.dispose();
  }

  Future<bool> _ensureLocationPermission() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever || permission == LocationPermission.denied) {
      setState(() => _status = 'Location permission is required to start a trip.');
      return false;
    }
    if (!await Geolocator.isLocationServiceEnabled()) {
      setState(() => _status = 'Please enable location services on this device.');
      return false;
    }

    await Permission.notification.request();
    if (permission == LocationPermission.whileInUse) {
      await Permission.locationAlways.request();
    }
    return true;
  }

  Future<void> _startTrip() async {
    setState(() => _busy = true);
    final granted = await _ensureLocationPermission();
    if (!granted) {
      setState(() => _busy = false);
      return;
    }

    try {
      final trip = await widget.api.startTrip(widget.bus.id);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(activeBusIdKey, widget.bus.id);

      final service = FlutterBackgroundService();
      await service.startService();

      _serviceSub = service.on('gpsUpdate').listen((event) {
        if (event == null || !mounted) return;
        setState(() {
          _updatesSent = event['updatesSent'] as int;
          _lastLat = event['latitude'] as double;
          _lastLng = event['longitude'] as double;
          _status = 'On trip — sharing live location...';
        });
      });

      _alertTimer = Timer.periodic(const Duration(seconds: 15), (_) => _pollAlerts());
      _pollAlerts();

      setState(() {
        _onTrip = true;
        _activeTrip = trip;
        _status = 'On trip — sharing live location...';
      });
    } catch (e) {
      setState(() => _status = 'Failed to start trip: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _endTrip() async {
    setState(() => _busy = true);
    try {
      final service = FlutterBackgroundService();
      service.invoke('stopService');
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(activeBusIdKey);
      _serviceSub?.cancel();
      _alertTimer?.cancel();

      if (_activeTrip != null) {
        await widget.api.endTrip(_activeTrip!.id);
      }

      setState(() {
        _onTrip = false;
        _activeTrip = null;
        _status = 'Trip ended. Location sharing stopped.';
        _alerts = [];
      });
    } catch (e) {
      setState(() => _status = 'Failed to end trip cleanly: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pollAlerts() async {
    try {
      final alerts = await widget.api.fetchAlerts(widget.bus.id);
      if (!mounted) return;
      setState(() => _alerts = alerts);
    } catch (_) {
      // Skip this tick; next poll will retry.
    }
  }

  Future<void> _setCrowdLevel(String level) async {
    setState(() => _crowdLevel = level);
    try {
      await widget.api.postCrowd(busId: widget.bus.id, level: level);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Crowd level reported: $level')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to report crowd level: $e')),
      );
    }
  }

  Future<void> _confirmEmergency() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report Emergency?'),
        content: Text(
          'This immediately alerts dispatch admins that bus '
          '${widget.bus.busNumber} needs urgent attention. Only use this for a real emergency.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Report Emergency'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await widget.api.reportEmergency(busId: widget.bus.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Emergency reported to dispatch.'), backgroundColor: Colors.red),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to report emergency: $e')),
      );
    }
  }

  bool get _hasRouteDeviation => _alerts.any((a) => a.type == 'ROUTE_DEVIATION');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(widget.bus.busNumber),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_hasRouteDeviation)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFF59E0B)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.warning_amber_rounded, color: Color(0xFFB45309)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'You appear to be off your assigned route.',
                        style: TextStyle(color: Color(0xFF92400E), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            Card(
              color: _onTrip ? const Color(0xFFD1FAE5) : Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Icon(
                      _onTrip ? Icons.gps_fixed : Icons.gps_off,
                      size: 48,
                      color: _onTrip ? const Color(0xFF059669) : Colors.black38,
                    ),
                    const SizedBox(height: 12),
                    Text(_status, textAlign: TextAlign.center),
                    if (_onTrip) ...[
                      const SizedBox(height: 8),
                      Text('Updates sent: $_updatesSent', style: const TextStyle(color: Colors.black54)),
                      if (_lastLat != null && _lastLng != null)
                        Text(
                          '${_lastLat!.toStringAsFixed(5)}, ${_lastLng!.toStringAsFixed(5)}',
                          style: const TextStyle(color: Colors.black54, fontSize: 12),
                        ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _busy ? null : (_onTrip ? _endTrip : _startTrip),
              icon: Icon(_onTrip ? Icons.stop_circle : Icons.play_circle_fill),
              label: Text(_onTrip ? 'End Trip' : 'Start Trip'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _onTrip ? Colors.redAccent : const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _confirmEmergency,
              icon: const Icon(Icons.emergency, color: Colors.red),
              label: const Text('Emergency', style: TextStyle(color: Colors.red)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
            const SizedBox(height: 32),
            const Text('Crowd Level', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Row(
              children: ['LOW', 'MEDIUM', 'HIGH'].map((level) {
                final selected = _crowdLevel == level;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: OutlinedButton(
                      onPressed: () => _setCrowdLevel(level),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: selected ? const Color(0xFF059669) : null,
                        foregroundColor: selected ? Colors.white : const Color(0xFF059669),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: Text(level),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
