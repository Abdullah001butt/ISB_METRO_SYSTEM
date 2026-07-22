import "package:flutter/material.dart";
import "api_client.dart";
import "models.dart";

class TripHistoryScreen extends StatefulWidget {
  final ApiClient api;
  const TripHistoryScreen({super.key, required this.api});

  @override
  State<TripHistoryScreen> createState() => _TripHistoryScreenState();
}

class _TripHistoryScreenState extends State<TripHistoryScreen> {
  List<TripHistoryEntry>? _trips;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final trips = await widget.api.fetchTripHistory();
      if (!mounted) return;
      setState(() {
        _trips = trips;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Failed to load trip history: $e');
    }
  }

  String _formatDuration(int? minutes) {
    if (minutes == null) return '—';
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (hours == 0) return '${mins}m';
    return '${hours}h ${mins}m';
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '—';
    final local = date.toLocal();
    return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')} '
        '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Trip History'),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _error != null
            ? ListView(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(_error!, textAlign: TextAlign.center),
                  ),
                ],
              )
            : _trips == null
                ? const Center(child: CircularProgressIndicator())
                : _trips!.isEmpty
                    ? ListView(
                        children: const [
                          Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'No completed trips yet.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.black54),
                            ),
                          ),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _trips!.length,
                        itemBuilder: (context, index) {
                          final trip = _trips![index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        trip.busNumber,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                      Text(
                                        trip.routeName,
                                        style: const TextStyle(color: Colors.black54, fontSize: 13),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    _formatDate(trip.startedAt),
                                    style: const TextStyle(color: Colors.black54, fontSize: 12),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      const Icon(Icons.timer_outlined, size: 16, color: Color(0xFF059669)),
                                      const SizedBox(width: 4),
                                      Text(_formatDuration(trip.durationMinutes)),
                                      const SizedBox(width: 20),
                                      const Icon(Icons.route_outlined, size: 16, color: Color(0xFF059669)),
                                      const SizedBox(width: 4),
                                      Text('${trip.distanceKm.toStringAsFixed(1)} km'),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
