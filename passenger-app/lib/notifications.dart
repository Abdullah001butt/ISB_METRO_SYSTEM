import 'package:flutter_local_notifications/flutter_local_notifications.dart';

const String notificationChannelId = 'metro_passenger_alerts';

final FlutterLocalNotificationsPlugin localNotifications = FlutterLocalNotificationsPlugin();

Future<void> initializeNotifications() async {
  const channel = AndroidNotificationChannel(
    notificationChannelId,
    'Bus Approaching Alerts',
    description: 'Notifies you when a bus is close to a station you are watching.',
    importance: Importance.high,
  );

  await localNotifications
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);

  await localNotifications.initialize(
    settings: const InitializationSettings(android: AndroidInitializationSettings('@mipmap/ic_launcher')),
  );
}

Future<void> showBusApproachingNotification(String stationName, int etaMinutes) async {
  await _showAlert(stationName.hashCode, 'Bus approaching', 'A bus is about $etaMinutes min from $stationName.');
}

Future<void> showRideAlert(String title, String body) async {
  await _showAlert('ride_mode'.hashCode, title, body);
}

Future<void> _showAlert(int id, String title, String body) async {
  await localNotifications.show(
    id: id,
    title: title,
    body: body,
    notificationDetails: const NotificationDetails(
      android: AndroidNotificationDetails(
        notificationChannelId,
        'Bus Approaching Alerts',
        importance: Importance.high,
        priority: Priority.high,
      ),
    ),
  );
}
