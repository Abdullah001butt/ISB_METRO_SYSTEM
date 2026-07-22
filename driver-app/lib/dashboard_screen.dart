import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_client.dart';
import 'models.dart';
import 'reporting_screen.dart';
import 'trip_history_screen.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  final ApiClient api;
  final Driver driver;
  const DashboardScreen({super.key, required this.api, required this.driver});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Timer? _messageTimer;
  Timer? _stopRequestTimer;
  final _notifications = FlutterLocalNotificationsPlugin();
  final Set<String> _notifiedMessageIds = {};
  final Set<String> _notifiedStopRequestIds = {};

  @override
  void initState() {
    super.initState();
    _notifications.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      ),
    );
    _messageTimer = Timer.periodic(const Duration(seconds: 20), (_) => _pollMessages());
    _pollMessages();
    _stopRequestTimer = Timer.periodic(const Duration(seconds: 10), (_) => _pollStopRequests());
    _pollStopRequests();
  }

  @override
  void dispose() {
    _messageTimer?.cancel();
    _stopRequestTimer?.cancel();
    super.dispose();
  }

  Future<void> _pollStopRequests() async {
    try {
      final requests = await widget.api.fetchStopRequests();
      for (final req in requests) {
        if (_notifiedStopRequestIds.contains(req.id)) continue;
        _notifiedStopRequestIds.add(req.id);
        await _notifications.show(
          id: req.id.hashCode,
          title: 'Stop requested',
          body: 'A passenger asked to stop at ${req.stationName}.',
          notificationDetails: const NotificationDetails(
            android: AndroidNotificationDetails(
              'metro_driver_stop_requests',
              'Passenger Stop Requests',
              importance: Importance.high,
              priority: Priority.high,
            ),
          ),
        );
        if (mounted) _showStopRequestDialog(req);
      }
    } catch (_) {
      // Skip this tick; next poll will retry.
    }
  }

  Future<void> _showStopRequestDialog(StopRequest req) async {
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        icon: const Icon(Icons.pin_drop, color: Color(0xFF059669), size: 36),
        title: const Text('Stop Requested'),
        content: Text('A passenger has requested to stop at ${req.stationName}.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Dismiss'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF059669)),
            onPressed: () async {
              Navigator.of(dialogContext).pop();
              try {
                await widget.api.respondToStopRequest(req.id, reply: 'On my way');
              } catch (_) {
                // Best-effort acknowledgement.
              }
            },
            child: const Text("Acknowledge (On my way)"),
          ),
        ],
      ),
    );
  }

  Future<void> _pollMessages() async {
    try {
      final messages = await widget.api.fetchMessages(unreadOnly: true);
      for (final message in messages) {
        if (_notifiedMessageIds.contains(message.id)) continue;
        _notifiedMessageIds.add(message.id);
        await _notifications.show(
          id: message.id.hashCode,
          title: 'Message from Dispatch',
          body: message.message,
          notificationDetails: const NotificationDetails(
            android: AndroidNotificationDetails(
              'metro_driver_messages',
              'Dispatch Messages',
              importance: Importance.high,
              priority: Priority.high,
            ),
          ),
        );
        await widget.api.markMessageRead(message.id);
      }
    } catch (_) {
      // Skip this tick; next poll will retry.
    }
  }

  Future<void> _signOut(BuildContext context) async {
    await widget.api.logout();
    await widget.api.clearToken();
    if (!context.mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => LoginScreen(api: widget.api)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final driver = widget.driver;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('My Buses'),
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: 'Trip History',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => TripHistoryScreen(api: widget.api)),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _signOut(context),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            color: const Color(0xFF059669),
            child: Text(
              'Welcome, ${driver.name}',
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: driver.buses.isEmpty
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'No bus is currently assigned to you. Contact the dispatch admin.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.black54),
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: driver.buses.length,
                    itemBuilder: (context, index) {
                      final bus = driver.buses[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: Color(0xFFD1FAE5),
                            child: Icon(Icons.directions_bus, color: Color(0xFF059669)),
                          ),
                          title: Text(bus.busNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text(
                            '${bus.route?.name ?? 'Unassigned route'} · ${bus.capacity} seats',
                          ),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => ReportingScreen(api: widget.api, bus: bus),
                              ),
                            );
                          },
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
