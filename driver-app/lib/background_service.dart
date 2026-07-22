import 'dart:convert';
import 'dart:ui';

import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

const String activeBusIdKey = 'active_bus_id';
const String notificationChannelId = 'metro_driver_tracking';
const String _gpsQueueKey = 'gps_offline_queue';
const int _maxQueueSize = 300;
const int _stationaryThrottleSeconds = 30;
const double _stationarySpeedKmh = 2.0;

Future<void> initializeBackgroundService() async {
  final service = FlutterBackgroundService();

  const channel = AndroidNotificationChannel(
    notificationChannelId,
    'Metro Bus Driver Tracking',
    description: 'Shows when your location is being shared while on a trip.',
    importance: Importance.low,
  );

  final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);

  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: _onServiceStart,
      autoStart: false,
      isForegroundMode: true,
      notificationChannelId: notificationChannelId,
      initialNotificationTitle: 'Metro Bus Driver',
      initialNotificationContent: 'Preparing to share your location...',
      foregroundServiceTypes: [AndroidForegroundType.location],
    ),
    iosConfiguration: IosConfiguration(),
  );
}

class _QueuedPoint {
  final String busId;
  final double latitude;
  final double longitude;
  final double? speed;

  _QueuedPoint({required this.busId, required this.latitude, required this.longitude, this.speed});

  Map<String, dynamic> toJson() => {
        'busId': busId,
        'latitude': latitude,
        'longitude': longitude,
        if (speed != null) 'speed': speed,
      };

  factory _QueuedPoint.fromJson(Map<String, dynamic> json) => _QueuedPoint(
        busId: json['busId'] as String,
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        speed: (json['speed'] as num?)?.toDouble(),
      );
}

Future<List<_QueuedPoint>> _loadQueue(SharedPreferences prefs) async {
  final raw = prefs.getString(_gpsQueueKey);
  if (raw == null) return [];
  final list = jsonDecode(raw) as List<dynamic>;
  return list.map((e) => _QueuedPoint.fromJson(e as Map<String, dynamic>)).toList();
}

Future<void> _saveQueue(SharedPreferences prefs, List<_QueuedPoint> queue) async {
  await prefs.setString(_gpsQueueKey, jsonEncode(queue.map((p) => p.toJson()).toList()));
}

@pragma('vm:entry-point')
void _onServiceStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();
  final busId = prefs.getString(activeBusIdKey);
  final api = ApiClient();

  if (busId == null) {
    service.stopSelf();
    return;
  }

  if (service is AndroidServiceInstance) {
    service.setForegroundNotificationInfo(
      title: 'Metro Bus Driver — On Duty',
      content: 'Sharing your live location...',
    );
  }

  service.on('stopService').listen((event) {
    service.stopSelf();
  });

  var updatesSent = 0;
  var queuedCount = 0;
  DateTime? lastPostTime;

  Future<void> flushQueue() async {
    final prefsNow = await SharedPreferences.getInstance();
    var queue = await _loadQueue(prefsNow);
    if (queue.isEmpty) return;

    final remaining = <_QueuedPoint>[];
    for (final point in queue) {
      try {
        await api.postGps(
          busId: point.busId,
          latitude: point.latitude,
          longitude: point.longitude,
          speed: point.speed,
        );
      } catch (_) {
        remaining.add(point);
      }
    }
    await _saveQueue(prefsNow, remaining);
    queuedCount = remaining.length;
  }

  Geolocator.getPositionStream(
    locationSettings: const LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    ),
  ).listen((position) async {
    final speedKmh = position.speed >= 0 ? position.speed * 3.6 : null;

    final now = DateTime.now();
    if (speedKmh != null &&
        speedKmh < _stationarySpeedKmh &&
        lastPostTime != null &&
        now.difference(lastPostTime!).inSeconds < _stationaryThrottleSeconds) {
      // Bus appears stationary and we posted recently — skip this tick to save battery/data.
      return;
    }

    await flushQueue();

    try {
      await api.postGps(
        busId: busId,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: speedKmh,
      );
      updatesSent++;
      lastPostTime = now;
    } catch (_) {
      final prefsNow = await SharedPreferences.getInstance();
      final queue = await _loadQueue(prefsNow);
      queue.add(_QueuedPoint(
        busId: busId,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: speedKmh,
      ));
      while (queue.length > _maxQueueSize) {
        queue.removeAt(0);
      }
      await _saveQueue(prefsNow, queue);
      queuedCount = queue.length;
    }

    service.invoke('gpsUpdate', {
      'latitude': position.latitude,
      'longitude': position.longitude,
      'updatesSent': updatesSent,
      'queuedCount': queuedCount,
    });
    if (service is AndroidServiceInstance) {
      service.setForegroundNotificationInfo(
        title: 'Metro Bus Driver — On Duty',
        content: queuedCount > 0
            ? '$updatesSent sent, $queuedCount queued offline'
            : 'Last update: ${position.latitude.toStringAsFixed(4)}, '
                '${position.longitude.toStringAsFixed(4)} ($updatesSent sent)',
      );
    }
  });
}
