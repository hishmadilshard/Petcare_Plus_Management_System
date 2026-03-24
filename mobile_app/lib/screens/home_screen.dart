// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../config/api_config.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/notification_badge.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get(
        '${ApiConfig.baseUrl}/dashboard',
      );
      setState(() {
        _stats   = res['data'];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: CustomScrollView(
          slivers: [

            // ── App Bar ──────────────────────────────
            SliverAppBar(
              expandedHeight: 200,
              floating: false,
              pinned: true,
              backgroundColor: AppTheme.navy800,
              automaticallyImplyLeading: false,

              // ✅ Notification badge in actions
              actions: const [
                NotificationBadge(),
                SizedBox(width: 8),
              ],

              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end:   Alignment.bottomRight,
                      colors: [
                        AppTheme.navy900,
                        AppTheme.navy800,
                        Color(0xFF1A3A6B),
                      ],
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(
                        20, 12, 20, 16,
                      ),
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        mainAxisAlignment:
                            MainAxisAlignment.end,
                        children: [
                          Row(
                            children: [
                              // Avatar
                              Container(
                                width: 52, height: 52,
                                decoration: BoxDecoration(
                                  color: Colors.white
                                      .withOpacity(0.15),
                                  borderRadius:
                                      BorderRadius.circular(14),
                                  border: Border.all(
                                    color: Colors.white
                                        .withOpacity(0.25),
                                    width: 1.5,
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    user?.initials ?? '👤',
                                    style: const TextStyle(
                                      fontFamily:
                                        'TimesNewRoman',
                                      color: Colors.white,
                                      fontWeight:
                                        FontWeight.w700,
                                      fontSize: 18,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),

                              // Greeting
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Good ${_greeting()}! 👋',
                                      style: TextStyle(
                                        fontFamily:
                                          'TimesNewRoman',
                                        fontSize: 13,
                                        color: Colors.white
                                            .withOpacity(0.65),
                                        fontStyle:
                                          FontStyle.italic,
                                      ),
                                    ),
                                    Text(
                                      user?.firstName ?? 'User',
                                      style: const TextStyle(
                                        fontFamily:
                                          'TimesNewRoman',
                                        fontSize: 22,
                                        fontWeight:
                                          FontWeight.w700,
                                        color: Colors.white,
                                        fontStyle:
                                          FontStyle.italic,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Branch + Role Row
                          Row(
                            children: [
                              // Role badge
                              Container(
                                padding:
                                  const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                decoration: BoxDecoration(
                                  color: Colors.white
                                      .withOpacity(0.12),
                                  borderRadius:
                                      BorderRadius.circular(20),
                                  border: Border.all(
                                    color: Colors.white
                                        .withOpacity(0.18),
                                  ),
                                ),
                                child: Text(
                                  user?.role ?? '—',
                                  style: const TextStyle(
                                    fontFamily: 'TimesNewRoman',
                                    fontSize: 11,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),

                              // Branch badge
                              if (user?.branchName != null) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding:
                                    const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                  decoration: BoxDecoration(
                                    color: Colors.white
                                        .withOpacity(0.1),
                                    borderRadius:
                                        BorderRadius.circular(20),
                                    border: Border.all(
                                      color: Colors.white
                                          .withOpacity(0.15),
                                    ),
                                  ),
                                  child: Text(
                                    '🏥  ${user!.branchName}',
                                    style: const TextStyle(
                                      fontFamily:
                                        'TimesNewRoman',
                                      fontSize: 11,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // ── Body ─────────────────────────────────
            SliverToBoxAdapter(
              child: _loading
                ? const Padding(
                    padding: EdgeInsets.only(top: 80),
                    child: Center(
                      child: CircularProgressIndicator(),
                    ),
                  )
                : Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [

                        // ── Stats Overview ───────────
                        const Text(
                          'Overview',
                          style: TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.navy900,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                        const SizedBox(height: 14),

                        GridView.count(
                          crossAxisCount: 2,
                          shrinkWrap: true,
                          physics:
                            const NeverScrollableScrollPhysics(),
                          crossAxisSpacing: 14,
                          mainAxisSpacing: 14,
                          childAspectRatio: 1.5,
                          children: [
                            _StatCard(
                              icon:  '🐾',
                              label: 'Total Pets',
                              value: _stats?['total_pets']
                                  ?.toString() ?? '0',
                              bg:    AppTheme.navy50,
                              color: AppTheme.navy700,
                            ),
                            _StatCard(
                              icon:  '📅',
                              label: 'Today\'s Appointments',
                              value: _stats?['today_appointments']
                                  ?.toString() ?? '0',
                              bg:    const Color(0xFFECFDF5),
                              color: AppTheme.success,
                            ),
                            _StatCard(
                              icon:  '🧾',
                              label: 'Pending Invoices',
                              value: _stats?['pending_invoices']
                                  ?.toString() ?? '0',
                              bg:    const Color(0xFFFFFBEB),
                              color: AppTheme.warning,
                            ),
                            _StatCard(
                              icon:  '📦',
                              label: 'Low Stock Items',
                              value: _stats?['low_stock']
                                  ?.toString() ?? '0',
                              bg:    const Color(0xFFFEF2F2),
                              color: AppTheme.danger,
                            ),
                          ],
                        ),
                        const SizedBox(height: 28),

                        // ── Quick Actions ─────────────
                        const Text(
                          'Quick Actions',
                          style: TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.navy900,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                        const SizedBox(height: 14),

                        GridView.count(
                          crossAxisCount: 3,
                          shrinkWrap: true,
                          physics:
                            const NeverScrollableScrollPhysics(),
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.95,
                          children: [
                            _QuickAction(
                              icon:  '🐾',
                              label: 'My Pets',
                              onTap: () =>
                                _navigateToTab(context, 1),
                            ),
                            _QuickAction(
                              icon:  '📅',
                              label: 'Book Appt',
                              onTap: () =>
                                _navigateToTab(context, 2),
                            ),
                            _QuickAction(
                              icon:  '🔲',
                              label: 'QR Scanner',
                              onTap: () =>
                                _openQrScanner(context),
                            ),
                            _QuickAction(
                              icon:  '🧾',
                              label: 'Invoices',
                              onTap: () =>
                                _navigateToTab(context, 3),
                            ),
                            _QuickAction(
                              icon:  '💉',
                              label: 'Vaccines',
                              onTap: () {},
                            ),
                            _QuickAction(
                              icon:  '📋',
                              label: 'Records',
                              onTap: () {},
                            ),
                          ],
                        ),
                        const SizedBox(height: 28),

                        // ── Upcoming Appointments ─────
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              "Today's Appointments",
                              style: TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.navy900,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                            TextButton(
                              onPressed: () =>
                                _navigateToTab(context, 2),
                              child: const Text(
                                'See All →',
                                style: TextStyle(
                                  fontFamily: 'TimesNewRoman',
                                  color: AppTheme.navy600,
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        _TodayAppointmentsList(),
                        const SizedBox(height: 28),

                        // ── Recent Invoices ───────────
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Recent Invoices',
                              style: TextStyle(
                                fontFamily: 'TimesNewRoman',
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.navy900,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                            TextButton(
                              onPressed: () =>
                                _navigateToTab(context, 3),
                              child: const Text(
                                'See All →',
                                style: TextStyle(
                                  fontFamily: 'TimesNewRoman',
                                  color: AppTheme.navy600,
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        _RecentInvoicesList(),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
            ),
          ],
        ),
      ),
    );
  }

  // Navigate to bottom nav tab
  void _navigateToTab(BuildContext context, int index) {
    final scaffold = Scaffold.maybeOf(context);
    if (scaffold == null) return;
    // Access bottom nav via parent MainScreen
    context.findAncestorStateOfType<State>()
        ?.setState(() {});
  }

  void _openQrScanner(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const _QrScannerWrapper(),
      ),
    );
  }
}

// ── QR Scanner Wrapper ────────────────────────────────────
class _QrScannerWrapper extends StatelessWidget {
  const _QrScannerWrapper();

  @override
  Widget build(BuildContext context) {
    // Lazy import to avoid circular deps
    return const _QrPlaceholder();
  }
}

class _QrPlaceholder extends StatelessWidget {
  const _QrPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: AppTheme.navy800,
        title: const Text('🔲  QR Scanner'),
      ),
      body: const Center(
        child: Text(
          '📷 QR Scanner\nPoint camera at a pet QR code',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: 'TimesNewRoman',
            fontSize: 16,
            color: AppTheme.gray500,
            fontStyle: FontStyle.italic,
          ),
        ),
      ),
    );
  }
}

// ── Stat Card Widget ──────────────────────────────────────
class _StatCard extends StatelessWidget {
  final String icon;
  final String label;
  final String value;
  final Color  bg;
  final Color  color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.bg,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(icon, style: const TextStyle(fontSize: 26)),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontFamily: 'TimesNewRoman',
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  color: color,
                  height: 1,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(
                  fontFamily: 'TimesNewRoman',
                  fontSize: 11,
                  color: AppTheme.gray500,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Quick Action Widget ───────────────────────────────────
class _QuickAction extends StatelessWidget {
  final String     icon;
  final String     label;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.gray100),
          boxShadow: [
            BoxShadow(
              color: AppTheme.navy900.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              icon,
              style: const TextStyle(fontSize: 28),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'TimesNewRoman',
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppTheme.navy700,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Today's Appointments List ─────────────────────────────
class _TodayAppointmentsList extends StatefulWidget {
  @override
  State<_TodayAppointmentsList> createState() =>
      _TodayAppointmentsListState();
}

class _TodayAppointmentsListState
    extends State<_TodayAppointmentsList> {
  List<dynamic> _list   = [];
  bool _loading         = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiService.get(
        '${ApiConfig.appointments}/today',
      );
      setState(() {
        _list    = res['data'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_list.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppTheme.gray50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.gray100),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('📅', style: TextStyle(fontSize: 22)),
            SizedBox(width: 10),
            Text(
              'No appointments today',
              style: TextStyle(
                fontFamily: 'TimesNewRoman',
                color: AppTheme.gray400,
                fontStyle: FontStyle.italic,
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: _list.take(3).map((a) {
        final status = a['status'] as String? ?? '';
        final statusBg = status == 'Completed'
          ? const Color(0xFFECFDF5)
          : status == 'Cancelled'
            ? const Color(0xFFFEE2E2)
            : AppTheme.navy50;
        final statusColor = status == 'Completed'
          ? const Color(0xFF059669)
          : status == 'Cancelled'
            ? const Color(0xFFDC2626)
            : AppTheme.navy600;

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.gray100),
            boxShadow: [
              BoxShadow(
                color: AppTheme.navy900.withOpacity(0.04),
                blurRadius: 6,
              ),
            ],
          ),
          child: Row(children: [
            // Date box
            Container(
              width: 46, height: 50,
              decoration: BoxDecoration(
                color: AppTheme.navy50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.navy100),
              ),
              child: Column(
                mainAxisAlignment:
                    MainAxisAlignment.center,
                children: [
                  Text(
                    _dayNum(a['appointment_date']),
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.navy700,
                    ),
                  ),
                  Text(
                    _monthAbbr(a['appointment_date']),
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 10,
                      color: AppTheme.gray500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    a['pet_name'] ?? '—',
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: AppTheme.navy800,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${a['service_type'] ?? '—'} · '
                    '${_formatTime(a['appointment_time'])}',
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 12,
                      color: AppTheme.gray500,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  if (a['vet_name'] != null)
                    Text(
                      'Dr. ${a['vet_name']}',
                      style: const TextStyle(
                        fontFamily: 'TimesNewRoman',
                        fontSize: 11,
                        color: AppTheme.navy400,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ),

            // Status badge
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 10, vertical: 4,
              ),
              decoration: BoxDecoration(
                color: statusBg,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                status,
                style: TextStyle(
                  fontFamily: 'TimesNewRoman',
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: statusColor,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ]),
        );
      }).toList(),
    );
  }

  String _dayNum(dynamic date) {
    try {
      return date.toString().substring(8, 10);
    } catch (_) { return '—'; }
  }

  String _monthAbbr(dynamic date) {
    const months = [
      'JAN','FEB','MAR','APR','MAY','JUN',
      'JUL','AUG','SEP','OCT','NOV','DEC',
    ];
    try {
      final m = int.parse(date.toString().substring(5, 7));
      return months[m - 1];
    } catch (_) { return ''; }
  }

  String _formatTime(dynamic time) {
    try {
      return time.toString().substring(0, 5);
    } catch (_) { return '—'; }
  }
}

// ── Recent Invoices List ──────────────────────────────────
class _RecentInvoicesList extends StatefulWidget {
  @override
  State<_RecentInvoicesList> createState() =>
      _RecentInvoicesListState();
}

class _RecentInvoicesListState
    extends State<_RecentInvoicesList> {
  List<dynamic> _list   = [];
  bool _loading         = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await ApiService.get(
        ApiConfig.invoices,
        params: {'limit': '3', 'page': '1'},
      );
      setState(() {
        _list    = res['data'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_list.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppTheme.gray50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.gray100),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('🧾', style: TextStyle(fontSize: 22)),
            SizedBox(width: 10),
            Text(
              'No recent invoices',
              style: TextStyle(
                fontFamily: 'TimesNewRoman',
                color: AppTheme.gray400,
                fontStyle: FontStyle.italic,
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: _list.map((inv) {
        final isPaid =
            inv['payment_status'] == 'Paid';
        final amount = double.tryParse(
          inv['total_amount'].toString(),
        ) ?? 0;

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.gray100),
            boxShadow: [
              BoxShadow(
                color: AppTheme.navy900.withOpacity(0.04),
                blurRadius: 6,
              ),
            ],
          ),
          child: Row(children: [
            // Icon
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: isPaid
                  ? const Color(0xFFECFDF5)
                  : const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  isPaid ? '✅' : '⏳',
                  style: const TextStyle(fontSize: 20),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    inv['invoice_number'] ?? '—',
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.navy700,
                    ),
                  ),
                  Text(
                    inv['owner_name'] ?? '—',
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 12,
                      color: AppTheme.gray500,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),

            // Amount + status
            Column(
              crossAxisAlignment:
                  CrossAxisAlignment.end,
              children: [
                Text(
                  'LKR ${amount.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.navy800,
                  ),
                ),
                const SizedBox(height: 3),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: isPaid
                      ? const Color(0xFFECFDF5)
                      : const Color(0xFFFFFBEB),
                    borderRadius:
                        BorderRadius.circular(20),
                    border: Border.all(
                      color: isPaid
                        ? const Color(0xFFA7F3D0)
                        : const Color(0xFFFDE68A),
                    ),
                  ),
                  child: Text(
                    inv['payment_status'] ?? '—',
                    style: TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isPaid
                        ? const Color(0xFF059669)
                        : const Color(0xFFD97706),
                    ),
                  ),
                ),
              ],
            ),
          ]),
        );
      }).toList(),
    );
  }
}