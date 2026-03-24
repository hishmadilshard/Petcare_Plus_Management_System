import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ── Background Message Handler ────────────────────────────
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  await Firebase.initializeApp();
  await NotificationService.showLocalNotification(message);
}

class NotificationService {
  static final FirebaseMessaging _messaging =
      FirebaseMessaging.instance;

  static final FlutterLocalNotificationsPlugin _local =
      FlutterLocalNotificationsPlugin();

  // ── Android plugin instance ✅ Direct cast ────────────
  static final AndroidFlutterLocalNotificationsPlugin
      _androidPlugin =
      AndroidFlutterLocalNotificationsPlugin();

  // ── iOS plugin instance ✅ Direct cast ────────────────
  static final IOSFlutterLocalNotificationsPlugin
      _iosPlugin =
      IOSFlutterLocalNotificationsPlugin();

  // ── Android Notification Channel ─────────────────────
  static const AndroidNotificationChannel _channel =
      AndroidNotificationChannel(
    'petcare_high_importance',
    'PetCare Plus Notifications',
    description: 'Appointment reminders and updates',
    importance:      Importance.max,
    playSound:       true,
    enableVibration: true,
  );

  // ── Initialize ────────────────────────────────────────
  static Future<void> initialize() async {
    // Init Firebase
    await Firebase.initializeApp();

    // Request FCM permissions
    final settings = await _messaging.requestPermission(
      alert:         true,
      badge:         true,
      sound:         true,
      announcement:  false,
      carPlay:       false,
      criticalAlert: false,
      provisional:   false,
    );

    debugPrint(
      '🔔 Permission: ${settings.authorizationStatus}',
    );

    // ── Init local notifications ──────────────────────
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings =
        InitializationSettings(
      android: androidSettings,
      iOS:     iosSettings,
    );

    await _local.initialize(
      initSettings,
      onDidReceiveNotificationResponse:
          (NotificationResponse response) {
        _handleNotificationTap(response.payload);
      },
    );

    // ── Create channel — Android only ✅ ─────────────
    if (Platform.isAndroid) {
      try {
        await _androidPlugin
            .createNotificationChannel(_channel);
        debugPrint('✅ Android channel created');
      } catch (e) {
        debugPrint('⚠️ Channel creation error: $e');
      }
    }

    // ── Request permissions — iOS only ✅ ─────────────
    if (Platform.isIOS) {
      try {
        await _iosPlugin.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );
        debugPrint('✅ iOS permissions requested');
      } catch (e) {
        debugPrint('⚠️ iOS permission error: $e');
      }
    }

    // Foreground presentation (iOS)
    await _messaging
        .setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    // Background handler
    FirebaseMessaging.onBackgroundMessage(
      firebaseMessagingBackgroundHandler,
    );

    // Foreground message handler
    FirebaseMessaging.onMessage.listen(
      (RemoteMessage message) {
        debugPrint(
          '📩 Foreground: ${message.notification?.title}',
        );
        showLocalNotification(message);
      },
    );

    // Opened from background
    FirebaseMessaging.onMessageOpenedApp.listen(
      (RemoteMessage message) {
        debugPrint(
          '📲 Opened from bg: ${message.data}',
        );
        _handleNotificationTap(jsonEncode(message.data));
      },
    );

    // Opened from terminated
    final RemoteMessage? initial =
        await _messaging.getInitialMessage();
    if (initial != null) {
      _handleNotificationTap(jsonEncode(initial.data));
    }

    // Save token
    await _saveFcmToken();

    // Token refresh
    _messaging.onTokenRefresh.listen((String token) {
      _saveTokenToPrefs(token);
      debugPrint('🔄 Token refreshed: $token');
    });
  }

  // ── Show Local Notification ───────────────────────────
  static Future<void> showLocalNotification(
    RemoteMessage message,
  ) async {
    final RemoteNotification? notification =
        message.notification;
    if (notification == null) return;

    final AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      _channel.id,
      _channel.name,
      channelDescription: _channel.description,
      importance:      Importance.max,
      priority:        Priority.high,
      playSound:       true,
      enableVibration: true,
      icon:            '@mipmap/ic_launcher',
      largeIcon: const DrawableResourceAndroidBitmap(
        '@mipmap/ic_launcher',
      ),
      styleInformation: BigTextStyleInformation(
        notification.body ?? '',
        htmlFormatBigText: false,
        contentTitle:      notification.title,
        summaryText:       'PetCare Plus',
      ),
    );

    const DarwinNotificationDetails iosDetails =
        DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS:     iosDetails,
    );

    await _local.show(
      notification.hashCode,
      notification.title,
      notification.body,
      details,
      payload: jsonEncode(message.data),
    );
  }

  // ── Show Appointment Reminder ─────────────────────────
  static Future<void> showAppointmentReminder({
    required String petName,
    required String vetName,
    required String date,
    required String time,
  }) async {
    final AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      _channel.id,
      _channel.name,
      channelDescription: _channel.description,
      importance:      Importance.max,
      priority:        Priority.high,
      playSound:       true,
      enableVibration: true,
      icon:            '@mipmap/ic_launcher',
    );

    const DarwinNotificationDetails iosDetails =
        DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS:     iosDetails,
    );

    await _local.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      '📅 Appointment Reminder',
      '$petName has an appointment with '
      'Dr. $vetName on $date at $time',
      details,
      payload: jsonEncode({
        'type':     'appointment_reminder',
        'pet_name': petName,
      }),
    );
  }

  // ── Save FCM Token ────────────────────────────────────
  static Future<void> _saveFcmToken() async {
    try {
      final String? token = await _messaging.getToken();
      if (token != null) {
        await _saveTokenToPrefs(token);
        debugPrint('🔑 FCM Token: $token');
      }
    } catch (e) {
      debugPrint('❌ FCM token error: $e');
    }
  }

  static Future<void> _saveTokenToPrefs(
    String token,
  ) async {
    final SharedPreferences prefs =
        await SharedPreferences.getInstance();
    await prefs.setString('fcm_token', token);
  }

  // ── Get Saved Token ───────────────────────────────────
  static Future<String?> getSavedToken() async {
    final SharedPreferences prefs =
        await SharedPreferences.getInstance();
    return prefs.getString('fcm_token');
  }

  // ── Handle Notification Tap ───────────────────────────
  static void _handleNotificationTap(String? payload) {
    if (payload == null) return;
    try {
      final Map<String, dynamic> data =
          jsonDecode(payload) as Map<String, dynamic>;
      final String? type = data['type'] as String?;
      debugPrint('📲 Tapped — type: $type');
    } catch (e) {
      debugPrint('❌ Payload error: $e');
    }
  }

  // ── Subscribe to Topic ────────────────────────────────
  static Future<void> subscribeToTopic(
    String topic,
  ) async {
    await _messaging.subscribeToTopic(topic);
    debugPrint('✅ Subscribed: $topic');
  }

  // ── Unsubscribe from Topic ────────────────────────────
  static Future<void> unsubscribeFromTopic(
    String topic,
  ) async {
    await _messaging.unsubscribeFromTopic(topic);
    debugPrint('❌ Unsubscribed: $topic');
  }

  // ── Clear Badge ───────────────────────────────────────
  static Future<void> clearBadge() async {
    if (Platform.isIOS) {
      try {
        await _iosPlugin.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );
      } catch (e) {
        debugPrint('⚠️ Clear badge error: $e');
      }
    }
  }
}