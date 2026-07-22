import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'api_client.dart';
import 'auth_provider.dart';
import 'language_provider.dart';
import 'models.dart';
import 'notifications.dart';
import 'ride_mode_screen.dart';

class StationDetailScreen extends StatefulWidget {
  final Station station;
  const StationDetailScreen({super.key, required this.station});

  @override
  State<StationDetailScreen> createState() => _StationDetailScreenState();
}

class _StationDetailScreenState extends State<StationDetailScreen> {
  List<LiveBus> _buses = [];
  Map<String, BatchEtaEntry> _etaByBusId = {};
  Timer? _pollTimer;
  bool _loading = true;
  bool _notifyEnabled = false;
  bool _hasNotifiedThisApproach = false;

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
      final routes = await api.fetchRoutes();
      final servingRouteIds = routes
          .where((r) => r.busRoutes.any((br) => br.station.id == widget.station.id))
          .map((r) => r.id)
          .toSet();

      final allBuses = await api.fetchLiveBuses();
      final serving = allBuses.where((b) => b.routeId != null && servingRouteIds.contains(b.routeId)).toList();

      final etas = await api.fetchBatchEta(widget.station.id, serving.map((b) => b.id).toList());

      if (!mounted) return;
      setState(() {
        _buses = serving..sort((a, b) => (etas[a.id]?.etaMinutes ?? 999).compareTo(etas[b.id]?.etaMinutes ?? 999));
        _etaByBusId = etas;
        _loading = false;
      });

      if (_notifyEnabled) _checkNotify(etas);
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _checkNotify(Map<String, BatchEtaEntry> etas) {
    final closest = etas.values
        .map((e) => e.etaMinutes)
        .whereType<double>()
        .fold<double?>(null, (min, v) => min == null || v < min ? v : min);

    if (closest != null && closest <= 5) {
      if (!_hasNotifiedThisApproach) {
        _hasNotifiedThisApproach = true;
        showBusApproachingNotification(widget.station.name, closest.round());
      }
    } else {
      _hasNotifiedThisApproach = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    final auth = context.watch<AuthProvider>();
    final isFav = auth.isFavorite(widget.station.id);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.station.name),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(isFav ? Icons.star : Icons.star_border),
            onPressed: () => auth.toggleFavorite(widget.station.id),
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(_notifyEnabled ? lang.t('notifyMeActive') : lang.t('notifyMe')),
              secondary: Icon(_notifyEnabled ? Icons.notifications_active : Icons.notifications_none),
              value: _notifyEnabled,
              onChanged: (v) => setState(() {
                _notifyEnabled = v;
                _hasNotifiedThisApproach = false;
              }),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: _loading
                ? Center(child: Text(lang.t('loading')))
                : _buses.isEmpty
                    ? Center(child: Text(lang.t('noBusesEnRoute')))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _buses.length,
                        itemBuilder: (context, i) {
                          final bus = _buses[i];
                          final eta = _etaByBusId[bus.id];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: Column(
                              children: [
                                ListTile(
                                  leading: const CircleAvatar(
                                    backgroundColor: Color(0xFFD1FAE5),
                                    child: Icon(Icons.directions_bus, color: Color(0xFF059669)),
                                  ),
                                  title: Text(bus.busNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  subtitle: Text(bus.routeName ?? ''),
                                  trailing: eta?.etaMinutes != null
                                      ? Column(
                                          mainAxisSize: MainAxisSize.min,
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text(
                                              '${eta!.etaMinutes!.round()} ${lang.t('minShort')}',
                                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF059669), fontSize: 16),
                                            ),
                                            Text(
                                              eta.source == 'ai' ? lang.t('aiPrediction') : lang.t('estimated'),
                                              style: const TextStyle(fontSize: 11, color: Colors.black54),
                                            ),
                                          ],
                                        )
                                      : Text(lang.t('etaUnavailable'), style: const TextStyle(color: Colors.black54)),
                                ),
                                if (bus.routeId != null)
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
                                    child: SizedBox(
                                      width: double.infinity,
                                      child: OutlinedButton.icon(
                                        onPressed: () => Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (_) => RideModeScreen(bus: bus, originStation: widget.station),
                                          ),
                                        ),
                                        icon: const Icon(Icons.directions_bus_filled, size: 16),
                                        label: const Text("I'm on this bus — Ride Mode"),
                                        style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFF059669)),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
