import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'firebase_options.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/pet_provider.dart';
import 'core/providers/appointment_provider.dart';
import 'core/providers/notification_provider.dart';
import 'core/services/fcm_service.dart';
import 'router/app_router.dart';
import 'shared/theme/app_theme.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (_) {
    // Firebase not configured — continue without it.
  }

  const AndroidInitializationSettings androidSettings =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
    requestAlertPermission: true,
    requestBadgePermission: true,
    requestSoundPermission: true,
  );
  const InitializationSettings initSettings = InitializationSettings(
    android: androidSettings,
    iOS: iosSettings,
  );
  await flutterLocalNotificationsPlugin.initialize(initSettings);

  runApp(const PetCarePlusApp());
}

class PetCarePlusApp extends StatelessWidget {
  const PetCarePlusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PetProvider()),
        ChangeNotifierProvider(create: (_) => AppointmentProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: Builder(
        builder: (context) {
          final router = AppRouter.createRouter(context);
          return MaterialApp.router(
            title: 'PetCare Plus',
            theme: AppTheme.lightTheme,
            routerConfig: router,
            debugShowCheckedModeBanner: false,
            builder: (context, child) {
              return _FcmInitializer(child: child ?? const SizedBox.shrink());
            },
          );
        },
      ),
    );
  }
}

class _FcmInitializer extends StatefulWidget {
  final Widget child;
  const _FcmInitializer({required this.child});

  @override
  State<_FcmInitializer> createState() => _FcmInitializerState();
}

class _FcmInitializerState extends State<_FcmInitializer> {
  @override
  void initState() {
    super.initState();
    FcmService.initialize(flutterLocalNotificationsPlugin);
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
