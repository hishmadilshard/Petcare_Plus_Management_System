import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/pet_provider.dart';
import '../../core/providers/appointment_provider.dart';
import '../../core/providers/notification_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  Future<void> _loadData() async {
    await Future.wait([
      context.read<PetProvider>().loadPets(),
      context.read<AppointmentProvider>().loadAppointments(),
      context.read<NotificationProvider>().loadNotifications(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final pets = context.watch<PetProvider>();
    final appts = context.watch<AppointmentProvider>();
    final notifs = context.watch<NotificationProvider>();

    final upcoming = appts.upcomingAppointments;
    final recentNotifs = notifs.notifications.take(3).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 140,
              floating: false,
              pinned: true,
              backgroundColor: AppColors.primary,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryLight],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.pets, color: Colors.white, size: 28),
                          const SizedBox(width: 8),
                          Text(
                            '${AppStrings.hello}, ${auth.userName}! 👋',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        AppStrings.appTagline,
                        style: TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                IconButton(
                  icon: Stack(
                    children: [
                      const Icon(Icons.notifications_outlined,
                          color: Colors.white),
                      if (notifs.unreadCount > 0)
                        Positioned(
                          right: 0,
                          top: 0,
                          child: Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(
                              color: AppColors.error,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                    ],
                  ),
                  onPressed: () => context.go('/notifications'),
                ),
              ],
            ),
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Stat cards
                  Row(
                    children: [
                      _StatCard(
                        label: AppStrings.myPets,
                        value: '${pets.pets.length}',
                        icon: Icons.pets,
                        color: AppColors.secondary,
                        onTap: () => context.go('/pets'),
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        label: AppStrings.nextAppointment,
                        value: upcoming.isEmpty
                            ? '—'
                            : _formatDate(
                                upcoming.first['appointment_date'] as String? ??
                                    ''),
                        icon: Icons.calendar_today,
                        color: AppColors.success,
                        onTap: () => context.go('/appointments'),
                      ),
                      const SizedBox(width: 12),
                      _StatCard(
                        label: AppStrings.unreadNotifications,
                        value: '${notifs.unreadCount}',
                        icon: Icons.notifications,
                        color: AppColors.warning,
                        onTap: () => context.go('/notifications'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Quick actions
                  const Text(
                    AppStrings.quickActions,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.8,
                    children: [
                      _QuickActionCard(
                        label: AppStrings.myPets,
                        icon: Icons.pets,
                        color: AppColors.secondary,
                        onTap: () => context.go('/pets'),
                      ),
                      _QuickActionCard(
                        label: AppStrings.bookAppointment,
                        icon: Icons.calendar_month,
                        color: AppColors.success,
                        onTap: () => context.go('/appointments/book'),
                      ),
                      _QuickActionCard(
                        label: AppStrings.medicalRecords,
                        icon: Icons.medical_services_outlined,
                        color: AppColors.accent,
                        onTap: () => context.push('/medical-records'),
                      ),
                      _QuickActionCard(
                        label: AppStrings.scanQr,
                        icon: Icons.qr_code_scanner,
                        color: AppColors.primary,
                        onTap: () => context.push('/scanner'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Recent notifications
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        AppStrings.recentNotifications,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.go('/notifications'),
                        child: const Text('See all'),
                      ),
                    ],
                  ),
                  if (recentNotifs.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Text(
                        AppStrings.noNotifications,
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    )
                  else
                    ...recentNotifs.map(
                      (n) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: Icon(
                            n['is_read'] == true
                                ? Icons.notifications_none
                                : Icons.notifications_active,
                            color: n['is_read'] == true
                                ? AppColors.grey400
                                : AppColors.primary,
                          ),
                          title: Text(
                            n['title'] as String? ?? '',
                            style: TextStyle(
                              fontWeight: n['is_read'] == true
                                  ? FontWeight.normal
                                  : FontWeight.bold,
                            ),
                          ),
                          subtitle: Text(n['message'] as String? ?? ''),
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String raw) {
    if (raw.isEmpty) return '—';
    try {
      final dt = DateTime.parse(raw);
      return DateFormat('MMM d').format(dt);
    } catch (_) {
      return raw;
    }
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Card(
          elevation: 2,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(height: 6),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
