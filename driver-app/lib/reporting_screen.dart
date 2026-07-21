import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'api_client.dart';
import 'models.dart';

class ReportingScreen extends StatefulWidget {
  final ApiClient api;
  final Bus bus;
  const ReportingScreen({super.key, required this.api, required this.bus});

  @override
  State<ReportingScreen> createState() => _ReportingScreenState();
}

class _ReportingScreenState extends State<ReportingScreen> {
  bool _onDuty = false;
  bool _busy = false;
  String _status = 'Tap "Go On Duty" to start sharing your live location.';
  Position? _lastPosition;
  int _updatesSent = 0;
  StreamSubscription<Position>? _positionSub;
  String _crowdLevel = 'LOW';

  @override
  void dispose() {
    _positionSub?.cancel();
    super.dispose();
  }

  Future<bool> _ensureLocationPermission() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever || permission == LocationPermission.denied) {
      setState(() => _status = 'Location permission is required to report GPS.');
      return false;
    }
    if (!await Geolocator.isLocationServiceEnabled()) {
      setState(() => _status = 'Please enable location services on this device.');
      return false;
    }
    return true;
  }

  Future<void> _toggleDuty() async {
    if (_onDuty) {
      _positionSub?.cancel();
      setState(() {
        _onDuty = false;
        _status = 'Off duty. Location sharing stopped.';
      });
      return;
    }

    setState(() => _busy = true);
    final granted = await _ensureLocationPermission();
    setState(() => _busy = false);
    if (!granted) return;

    setState(() {
      _onDuty = true;
      _status = 'On duty — sharing live location...';
    });

    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((position) async {
      _lastPosition = position;
      try {
        await widget.api.postGps(
          busId: widget.bus.id,
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed >= 0 ? position.speed * 3.6 : null,
        );
        if (!mounted) return;
        setState(() {
          _updatesSent++;
          _status = 'On duty — last update sent successfully.';
        });
      } catch (e) {
        if (!mounted) return;
        setState(() => _status = 'Failed to send update: $e');
      }
    });
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
            Card(
              color: _onDuty ? const Color(0xFFD1FAE5) : Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Icon(
                      _onDuty ? Icons.gps_fixed : Icons.gps_off,
                      size: 48,
                      color: _onDuty ? const Color(0xFF059669) : Colors.black38,
                    ),
                    const SizedBox(height: 12),
                    Text(_status, textAlign: TextAlign.center),
                    if (_onDuty) ...[
                      const SizedBox(height: 8),
                      Text('Updates sent: $_updatesSent', style: const TextStyle(color: Colors.black54)),
                      if (_lastPosition != null)
                        Text(
                          '${_lastPosition!.latitude.toStringAsFixed(5)}, ${_lastPosition!.longitude.toStringAsFixed(5)}',
                          style: const TextStyle(color: Colors.black54, fontSize: 12),
                        ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _busy ? null : _toggleDuty,
              icon: Icon(_onDuty ? Icons.stop_circle : Icons.play_circle_fill),
              label: Text(_onDuty ? 'Go Off Duty' : 'Go On Duty'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _onDuty ? Colors.redAccent : const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
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
