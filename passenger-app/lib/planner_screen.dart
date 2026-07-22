import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'api_client.dart';
import 'language_provider.dart';
import 'models.dart';
import 'widgets/app_top_bar.dart';

const _avgSpeedKmh = 22.0;

double _haversineKm(double lat1, double lon1, double lat2, double lon2) {
  const r = 6371.0;
  final dLat = (lat2 - lat1) * pi / 180;
  final dLon = (lon2 - lon1) * pi / 180;
  final a = sin(dLat / 2) * sin(dLat / 2) +
      cos(lat1 * pi / 180) * cos(lat2 * pi / 180) * sin(dLon / 2) * sin(dLon / 2);
  return r * 2 * atan2(sqrt(a), sqrt(1 - a));
}

class TripResult {
  final BusRoute route;
  final List<BusRouteEntry> stations;
  final double distanceKm;
  final double etaMinutes;
  TripResult({required this.route, required this.stations, required this.distanceKm, required this.etaMinutes});
}

class PlannerScreen extends StatefulWidget {
  const PlannerScreen({super.key});

  @override
  State<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends State<PlannerScreen> {
  List<BusRoute> _routes = [];
  bool _loading = true;
  String? _originId;
  String? _destinationId;

  @override
  void initState() {
    super.initState();
    context.read<ApiClient>().fetchRoutes().then((routes) {
      if (!mounted) return;
      setState(() {
        _routes = routes;
        _loading = false;
      });
    }).catchError((_) {
      if (mounted) setState(() => _loading = false);
    });
  }

  List<Station> get _allStations {
    final map = <String, Station>{};
    for (final r in _routes) {
      for (final br in r.busRoutes) {
        map[br.station.id] = br.station;
      }
    }
    final list = map.values.toList();
    list.sort((a, b) => a.name.compareTo(b.name));
    return list;
  }

  Object? _computeResult() {
    if (_originId == null || _destinationId == null || _originId == _destinationId) return null;

    for (final route in _routes) {
      final sorted = route.busRoutes.toList()..sort((a, b) => a.sequence.compareTo(b.sequence));
      final originIdx = sorted.indexWhere((br) => br.station.id == _originId);
      final destIdx = sorted.indexWhere((br) => br.station.id == _destinationId);
      if (originIdx == -1 || destIdx == -1 || originIdx == destIdx) continue;

      final from = originIdx < destIdx ? originIdx : destIdx;
      final to = originIdx < destIdx ? destIdx : originIdx;
      final segment = sorted.sublist(from, to + 1);

      double distanceKm = 0;
      for (var i = 0; i < segment.length - 1; i++) {
        final a = segment[i].station;
        final b = segment[i + 1].station;
        distanceKm += _haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
      }

      return TripResult(
        route: route,
        stations: originIdx < destIdx ? segment : segment.reversed.toList(),
        distanceKm: distanceKm,
        etaMinutes: (distanceKm / _avgSpeedKmh) * 60,
      );
    }
    return 'no-route';
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final stations = _allStations;
    final result = _computeResult();

    return Scaffold(
      appBar: AppTopBar(title: lang.t('plannerTitle')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(lang.t('plannerSubtitle'), style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 16),
          Text(lang.t('from'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          DropdownButtonFormField<String>(
            initialValue: _originId,
            isExpanded: true,
            decoration: const InputDecoration(border: OutlineInputBorder()),
            hint: Text(lang.t('selectStation')),
            items: stations.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))).toList(),
            onChanged: (v) => setState(() => _originId = v),
          ),
          const SizedBox(height: 16),
          Text(lang.t('to'), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          DropdownButtonFormField<String>(
            initialValue: _destinationId,
            isExpanded: true,
            decoration: const InputDecoration(border: OutlineInputBorder()),
            hint: Text(lang.t('selectStation')),
            items: stations.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))).toList(),
            onChanged: (v) => setState(() => _destinationId = v),
          ),
          const SizedBox(height: 24),
          if (_loading)
            Center(child: Text(lang.t('loading')))
          else if (result == 'no-route')
            Card(child: Padding(padding: const EdgeInsets.all(16), child: Text(lang.t('noRouteConnects'), textAlign: TextAlign.center)))
          else if (result is TripResult)
            _buildResultCard(result, lang)
          else
            Center(child: Text(lang.t('selectToSeeEstimate'), style: const TextStyle(color: Colors.black54))),
        ],
      ),
    );
  }

  Widget _buildResultCard(TripResult result, LanguageProvider lang) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.alt_route, color: Color(0xFF059669), size: 18),
                const SizedBox(width: 8),
                Text(result.route.name, style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(8)),
              child: Row(
                children: [
                  const Icon(Icons.schedule, color: Color(0xFF059669)),
                  const SizedBox(width: 8),
                  Text('${result.etaMinutes.round()} min', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF047857))),
                  const SizedBox(width: 8),
                  Text('(~${result.distanceKm.toStringAsFixed(1)} km)'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                for (var i = 0; i < result.stations.length; i++) ...[
                  Chip(label: Text(result.stations[i].station.name, style: const TextStyle(fontSize: 12))),
                  if (i < result.stations.length - 1) const Icon(Icons.arrow_forward, size: 14, color: Colors.black38),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
