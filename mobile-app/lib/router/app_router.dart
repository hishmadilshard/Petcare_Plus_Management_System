import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/providers/auth_provider.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/home/home_screen.dart';
import '../features/pets/pets_screen.dart';
import '../features/pets/pet_detail_screen.dart';
import '../features/pets/pet_qr_screen.dart';
import '../features/appointments/appointments_screen.dart';
import '../features/appointments/book_appointment_screen.dart';
import '../features/appointments/appointment_detail_screen.dart';
import '../features/medical/medical_records_screen.dart';
import '../features/medical/medical_detail_screen.dart';
import '../features/invoices/invoices_screen.dart';
import '../features/invoices/invoice_detail_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/scanner/qr_scanner_screen.dart';
import '../features/profile/profile_screen.dart';
import '../shared/widgets/bottom_nav_widget.dart';

class AppRouter {
  static GoRouter createRouter(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    return GoRouter(
      initialLocation: '/home',
      redirect: (context, state) async {
        await authProvider.loadUser();
        final isLoggedIn = authProvider.isLoggedIn;
        final isAuthRoute = state.matchedLocation == '/login' ||
            state.matchedLocation == '/register';

        if (!isLoggedIn && !isAuthRoute) return '/login';
        if (isLoggedIn && isAuthRoute) return '/home';
        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),
        ShellRoute(
          builder: (context, state, child) =>
              BottomNavWidget(child: child, location: state.matchedLocation),
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
            GoRoute(
              path: '/pets',
              builder: (context, state) => const PetsScreen(),
              routes: [
                GoRoute(
                  path: ':id',
                  builder: (context, state) =>
                      PetDetailScreen(petId: state.pathParameters['id']!),
                  routes: [
                    GoRoute(
                      path: 'qr',
                      builder: (context, state) =>
                          PetQrScreen(petId: state.pathParameters['id']!),
                    ),
                  ],
                ),
              ],
            ),
            GoRoute(
              path: '/appointments',
              builder: (context, state) => const AppointmentsScreen(),
              routes: [
                GoRoute(
                  path: 'book',
                  builder: (context, state) => const BookAppointmentScreen(),
                ),
                GoRoute(
                  path: ':id',
                  builder: (context, state) => AppointmentDetailScreen(
                    appointmentId: state.pathParameters['id']!,
                  ),
                ),
              ],
            ),
            GoRoute(
              path: '/notifications',
              builder: (context, state) => const NotificationsScreen(),
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
        GoRoute(
          path: '/medical-records',
          builder: (context, state) => MedicalRecordsScreen(
            petId: state.uri.queryParameters['petId'],
          ),
          routes: [
            GoRoute(
              path: ':id',
              builder: (context, state) => MedicalDetailScreen(
                recordId: state.pathParameters['id']!,
              ),
            ),
          ],
        ),
        GoRoute(
          path: '/invoices',
          builder: (context, state) => const InvoicesScreen(),
          routes: [
            GoRoute(
              path: ':id',
              builder: (context, state) => InvoiceDetailScreen(
                invoiceId: state.pathParameters['id']!,
              ),
            ),
          ],
        ),
        GoRoute(
          path: '/scanner',
          builder: (context, state) => const QrScannerScreen(),
        ),
      ],
    );
  }
}
