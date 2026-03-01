import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../constants/api_constants.dart';
import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background message received — handled by FCM automatically.
}

class FcmService {
  static final ApiService _api = ApiService();

  static Future<void> initialize(
    FlutterLocalNotificationsPlugin localNotifications,
  ) async {
    try {
      final messaging = FirebaseMessaging.instance;

      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      FirebaseMessaging.onBackgroundMessage(
        _firebaseMessagingBackgroundHandler,
      );

      const androidChannel = AndroidNotificationChannel(
        'petcare_plus_channel',
        'PetCare Plus Notifications',
        description: 'Notifications from PetCare Plus',
        importance: Importance.high,
      );

      await localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(androidChannel);

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        final notification = message.notification;
        if (notification != null) {
          localNotifications.show(
            notification.hashCode,
            notification.title,
            notification.body,
            NotificationDetails(
              android: AndroidNotificationDetails(
                androidChannel.id,
                androidChannel.name,
                channelDescription: androidChannel.description,
                icon: '@mipmap/ic_launcher',
              ),
            ),
          );
        }
      });

      final token = await messaging.getToken();
      if (token != null) {
        await _sendTokenToServer(token);
      }

      messaging.onTokenRefresh.listen(_sendTokenToServer);
    } catch (_) {
      // Firebase not configured — skip FCM setup.
    }
  }

  static Future<void> _sendTokenToServer(String token) async {
    try {
      await _api.put(
        ApiConstants.profile,
        data: {'fcm_token': token},
      );
    } catch (_) {}
  }
}
