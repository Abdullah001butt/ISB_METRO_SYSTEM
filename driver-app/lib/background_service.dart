import 'dart:ui';

import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

const String activeBusIdKey = 'active_bus_id';
const String notificationChannelId = 'metro_driver_tracking';

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

  Geolocator.getPositionStream(
    locationSettings: const LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    ),
  ).listen((position) async {
    try {
      await api.postGps(
        busId: busId,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed >= 0 ? position.speed * 3.6 : null,
      );
      updatesSent++;
      service.invoke('gpsUpdate', {
        'latitude': position.latitude,
        'longitude': position.longitude,
        'updatesSent': updatesSent,
      });
      if (service is AndroidServiceInstance) {
        service.setForegroundNotificationInfo(
          title: 'Metro Bus Driver — On Duty',
          content: 'Last update: ${position.latitude.toStringAsFixed(4)}, '
              '${position.longitude.toStringAsFixed(4)} ($updatesSent sent)',
        );
      }
    } catch (_) {
      // Network hiccups are expected on a moving bus; the next tick retries.
    }
  });
}
