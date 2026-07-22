import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as latlong;
import 'package:provider/provider.dart';
import 'api_client.dart';
import 'language_provider.dart';
import 'models.dart';
import 'notifications.dart';

double _haversineKm(double lat1, double lon1, double lat2, double lon2) {
  const r = 6371.0;
  final dLat = (lat2 - lat1) * pi / 180;
  final dLon = (lon2 - lon1) * pi / 180;
  final a = sin(dLat / 2) * sin(dLat / 2) +
      cos(lat1 * pi / 180) * cos(lat2 * pi / 180) * sin(dLon / 2) * sin(dLon / 2);
  return r * 2 * atan2(sqrt(a), sqrt(1 - a));
}

class RideModeScreen extends StatefulWidget {
  final LiveBus bus;
  final Station originStation;
  const RideModeScreen({super.key, required this.bus, required this.originStation});

  @override
  State<RideModeScreen> createState() => _RideModeScreenState();
}

class _RideModeScreenState extends State<RideModeScreen> {
  List<BusRouteEntry> _routeStations = [];
  Station? _destination;
  bool _loadingRoute = true;

  LiveBus? _liveBus;
  Timer? _pollTimer;
  int? _currentSequence;
  bool _alertedApproaching = false;
  bool _alertedArrived = false;

  StopRequestStatus? _stopRequest;
  Timer? _stopRequestPollTimer;
  bool _sendingStopRequest = false;

  @override
  void initState() {
    super.initState();
    _loadRoute();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _stopRequestPollTimer?.cancel();
    super.dispose();
  }

  Future<void> _requestStop() async {
    if (_destination == null || _sendingStopRequest) return;
    final api = context.read<ApiClient>();
    setState(() => _sendingStopRequest = true);
    try {
      final created = await api.requestStop(busId: widget.bus.id, stationId: _destination!.id);
      if (!mounted) return;
      setState(() {
        _stopRequest = created;
        _sendingStopRequest = false;
      });
      HapticFeedback.mediumImpact();
      _stopRequestPollTimer?.cancel();
      _stopRequestPollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _pollStopRequestStatus());
    } catch (_) {
      if (mounted) setState(() => _sendingStopRequest = false);
    }
  }

  Future<void> _pollStopRequestStatus() async {
    final current = _stopRequest;
    if (current == null || current.isAcknowledged) return;
    final api = context.read<ApiClient>();
    try {
      final updated = await api.fetchStopRequestStatus(current.id);
      if (!mounted) return;
      setState(() => _stopRequest = updated);
      if (updated.isAcknowledged) {
        HapticFeedback.lightImpact();
        showRideAlert('Driver acknowledged', updated.driverReply ?? 'The driver will stop for you.');
        _stopRequestPollTimer?.cancel();
      }
    } catch (_) {
      // Keep last-known state; next poll retries.
    }
  }

  Future<void> _loadRoute() async {
    final api = context.read<ApiClient>();
    try {
      final routes = await api.fetchRoutes();
      final route = routes.where((r) => r.id == widget.bus.routeId).firstOrNull;
      if (!mounted) return;
      setState(() {
        _routeStations = (route?.busRoutes.toList() ?? [])..sort((a, b) => a.sequence.compareTo(b.sequence));
        _loadingRoute = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingRoute = false);
    }
  }

  void _selectDestination(Station station) {
    setState(() => _destination = station);
    _pollTimer = Timer.periodic(const Duration(seconds: 6), (_) => _pollBus());
    _pollBus();
  }

  Future<void> _pollBus() async {
    final api = context.read<ApiClient>();
    try {
      final buses = await api.fetchLiveBuses();
      final updated = buses.where((b) => b.id == widget.bus.id).firstOrNull;
      if (!mounted || updated == null || updated.latitude == null) return;

      double bestDistance = double.infinity;
      int bestSequence = _routeStations.isNotEmpty ? _routeStations.first.sequence : 0;
      for (final entry in _routeStations) {
        final d = _haversineKm(updated.latitude!, updated.longitude!, entry.station.latitude, entry.station.longitude);
        if (d < bestDistance) {
          bestDistance = d;
          bestSequence = entry.sequence;
        }
      }

      setState(() {
        _liveBus = updated;
        _currentSequence = bestSequence;
      });

      _checkAlerts();
    } catch (_) {
      // Keep last-known state; next poll retries.
    }
  }


  void _checkAlerts() {
    if (_destination == null || _currentSequence == null) return;
    final destEntry = _routeStations.where((e) => e.station.id == _destination!.id).firstOrNull;
    if (destEntry == null) return;

    final stopsToGo = destEntry.sequence - _currentSequence!;

    if (stopsToGo <= 0 && !_alertedArrived) {
      _alertedArrived = true;
      HapticFeedback.heavyImpact();
      showRideAlert('You have arrived', 'This is your stop: ${_destination!.name}.');
    } else if (stopsToGo <= 1 && stopsToGo > 0 && !_alertedApproaching) {
      _alertedApproaching = true;
      HapticFeedback.mediumImpact();
      showRideAlert('Almost there', 'Get ready — ${_destination!.name} is coming up.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text('Ride Mode — ${widget.bus.busNumber}'),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
      ),
      body: _loadingRoute
          ? Center(child: Text(lang.t('loading')))
          : _destination == null
              ? _buildDestinationPicker()
              : _buildRideView(),
    );
  }

  Widget _buildDestinationPicker() {
    final originIndex = _routeStations.indexWhere((e) => e.station.id == widget.originStation.id);
    final candidates = originIndex == -1 ? _routeStations : _routeStations.sublist(originIndex + 1);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            'Where are you getting off?',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
        Expanded(
          child: candidates.isEmpty
              ? const Center(child: Text('No further stations on this route.'))
              : ListView.builder(
                  itemCount: candidates.length,
                  itemBuilder: (context, i) {
                    final entry = candidates[i];
                    return ListTile(
                      leading: const Icon(Icons.location_on_outlined, color: Color(0xFF059669)),
                      title: Text(entry.station.name),
                      onTap: () => _selectDestination(entry.station),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildRideView() {
    final destEntry = _routeStations.where((e) => e.station.id == _destination!.id).firstOrNull;
    final stopsToGo = (destEntry != null && _currentSequence != null) ? destEntry.sequence - _currentSequence! : null;
    final arrived = stopsToGo != null && stopsToGo <= 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          color: arrived ? const Color(0xFF059669) : const Color(0xFFD1FAE5),
          child: Column(
            children: [
              Icon(
                arrived ? Icons.celebration : Icons.directions_bus,
                size: 40,
                color: arrived ? Colors.white : const Color(0xFF059669),
              ),
              const SizedBox(height: 8),
              Text(
                arrived ? "You've arrived!" : (stopsToGo != null ? '$stopsToGo stop${stopsToGo == 1 ? '' : 's'} to go' : 'Waiting for bus location...'),
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: arrived ? Colors.white : const Color(0xFF047857),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Destination: ${_destination!.name}',
                style: TextStyle(color: arrived ? Colors.white70 : Colors.black54),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _routeStations.length,
            itemBuilder: (context, i) {
              final entry = _routeStations[i];
              final isPast = _currentSequence != null && entry.sequence < _currentSequence!;
              final isCurrent = entry.sequence == _currentSequence;
              final isDestination = entry.station.id == _destination!.id;
              return ListTile(
                dense: true,
                leading: Icon(
                  isCurrent ? Icons.directions_bus : Icons.circle,
                  size: isCurrent ? 20 : 10,
                  color: isPast
                      ? Colors.black26
                      : isDestination
                          ? Colors.red
                          : const Color(0xFF059669),
                ),
                title: Text(
                  entry.station.name,
                  style: TextStyle(
                    fontWeight: isDestination || isCurrent ? FontWeight.bold : FontWeight.normal,
                    color: isPast ? Colors.black38 : Colors.black87,
                  ),
                ),
                trailing: isDestination ? const Icon(Icons.flag, color: Colors.red, size: 18) : null,
              );
            },
          ),
        ),
        if (_liveBus?.latitude != null)
          SizedBox(
            height: 160,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: latlong.LatLng(_liveBus!.latitude!, _liveBus!.longitude!),
                initialZoom: 14,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.isbmetro.passenger_app',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: latlong.LatLng(_liveBus!.latitude!, _liveBus!.longitude!),
                      width: 18,
                      height: 18,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                    Marker(
                      point: latlong.LatLng(_destination!.latitude, _destination!.longitude),
                      width: 14,
                      height: 14,
                      child: const Icon(Icons.flag, color: Colors.red, size: 20),
                    ),
                  ],
                ),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: _buildStopRequestControl(),
        ),
        Padding(
          padding: const EdgeInsets.all(12),
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('End Ride'),
          ),
        ),
      ],
    );
  }

  Widget _buildStopRequestControl() {
    final request = _stopRequest;
    if (request == null) {
      return SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: _sendingStopRequest ? null : _requestStop,
          icon: const Icon(Icons.pin_drop),
          label: Text(_sendingStopRequest ? 'Sending...' : 'Request Stop'),
          style: FilledButton.styleFrom(backgroundColor: const Color(0xFF059669)),
        ),
      );
    }

    final acknowledged = request.isAcknowledged;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: acknowledged ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(
            acknowledged ? Icons.check_circle : Icons.hourglass_top,
            color: acknowledged ? const Color(0xFF059669) : const Color(0xFFB45309),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              acknowledged
                  ? (request.driverReply ?? 'Driver acknowledged your stop request.')
                  : 'Stop requested — waiting for the driver to acknowledge...',
              style: TextStyle(
                color: acknowledged ? const Color(0xFF047857) : const Color(0xFF92400E),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
