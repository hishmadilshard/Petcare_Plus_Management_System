import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'config/app_theme.dart';
import 'providers/auth_provider.dart';
import 'screens/splash_screen.dart';
import 'services/notification_service.dart' show NotificationService;

// ── Global Navigator Key ──────────────────────────────────
final GlobalKey<NavigatorState> navigatorKey =
    GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Status bar
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor:         Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  // ✅ Initialize Firebase + Notifications
  await NotificationService.initialize();

  runApp(const PetCarePlusApp());
}

class PetCarePlusApp extends StatelessWidget {
  const PetCarePlusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider(),
        ),
      ],
      child: MaterialApp(
        title:          'PetCare Plus',
        debugShowCheckedModeBanner: false,
        theme:          AppTheme.theme,
        navigatorKey:   navigatorKey,    // ✅ Global key
        home:           const SplashScreen(),
      ),
    );
  }
}