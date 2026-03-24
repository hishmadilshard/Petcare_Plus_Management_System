// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/api_config.dart';
import '../../models/appointment_model.dart';
import '../../services/api_service.dart';
import 'book_appointment_screen.dart';
import 'appointment_detail_screen.dart';

class AppointmentsListScreen extends StatefulWidget {
  const AppointmentsListScreen({super.key});

  @override
  State<AppointmentsListScreen> createState() =>
      _AppointmentsListScreenState();
}

class _AppointmentsListScreenState
    extends State<AppointmentsListScreen> {
  List<AppointmentModel> _appointments = [];
  bool   _loading   = true;
  String _statusFilter = '';

  final _statuses = [
    'All', 'Scheduled', 'Completed',
    'Cancelled', 'No Show',
  ];

  final _statusColors = {
    'Scheduled': (
      bg: const Color(0xFFDBEAFE),
      color: const Color(0xFF1D4ED8),
    ),
    'Completed': (
      bg: const Color(0xFFECFDF5),
      color: const Color(0xFF059669),
    ),
    'Cancelled': (
      bg: const Color(0xFFFEE2E2),
      color: const Color(0xFFDC2626),
    ),
    'No Show': (
      bg: const Color(0xFFFFF7ED),
      color: const Color(0xFFEA580C),
    ),
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get(
        ApiConfig.appointments,
        params: {
          'limit': '100',
          if (_statusFilter.isNotEmpty &&
              _statusFilter != 'All')
            'status': _statusFilter,
        },
      );
      final list = res['data'] as List<dynamic>? ?? [];
      setState(() {
        _appointments = list
            .map((e) => AppointmentModel.fromJson(
                e as Map<String, dynamic>))
            .toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.gray50,
      appBar: AppBar(
        backgroundColor: AppTheme.navy800,
        title: const Text('📅  Appointments'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.navy700,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'Book Appointment',
          style: TextStyle(
            fontFamily: 'TimesNewRoman',
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const BookAppointmentScreen(),
            ),
          );
          _load();
        },
      ),
      body: Column(
        children: [
          // Status Filter Bar
          Container(
            color: AppTheme.navy800,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
            child: SizedBox(
              height: 34,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _statuses.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final s = _statuses[i];
                  final selected = _statusFilter == s ||
                      (_statusFilter.isEmpty && s == 'All');
                  return GestureDetector(
                    onTap: () {
                      setState(() =>
                        _statusFilter = s == 'All' ? '' : s);
                      _load();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: selected
                          ? Colors.white
                          : Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        s,
                        style: TextStyle(
                          fontFamily: 'TimesNewRoman',
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: selected
                            ? AppTheme.navy800
                            : Colors.white,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // List
          Expanded(
            child: _loading
              ? const Center(
                  child: CircularProgressIndicator())
              : _appointments.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('📅',
                          style: TextStyle(fontSize: 56)),
                        SizedBox(height: 14),
                        Text(
                          'No appointments found',
                          style: TextStyle(
                            fontFamily: 'TimesNewRoman',
                            fontSize: 16,
                            color: AppTheme.gray500,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(
                        16, 16, 16, 100,
                      ),
                      itemCount: _appointments.length,
                      itemBuilder: (_, i) {
                        final a = _appointments[i];
                        final sc = _statusColors[a.status];
                        return GestureDetector(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                AppointmentDetailScreen(
                                  appointment: a,
                                ),
                            ),
                          ),
                          child: Container(
                            margin: const EdgeInsets
                                .only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius:
                                  BorderRadius.circular(16),
                              border: Border.all(
                                color: AppTheme.gray100),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.navy900
                                      .withOpacity(0.05),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  // Date Box
                                  Container(
                                    width: 52, height: 56,
                                    decoration: BoxDecoration(
                                      color: AppTheme.navy50,
                                      borderRadius:
                                        BorderRadius.circular(12),
                                      border: Border.all(
                                        color: AppTheme.navy100),
                                    ),
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          a.appointmentDate
                                              .substring(8, 10),
                                          style: const TextStyle(
                                            fontFamily:
                                              'TimesNewRoman',
                                            fontSize: 18,
                                            fontWeight:
                                              FontWeight.w700,
                                            color:
                                              AppTheme.navy700,
                                          ),
                                        ),
                                        Text(
                                          _monthAbbr(
                                            a.appointmentDate),
                                          style: const TextStyle(
                                            fontFamily:
                                              'TimesNewRoman',
                                            fontSize: 11,
                                            color:
                                              AppTheme.gray500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 14),

                                  // Info
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          a.petName ?? '—',
                                          style: const TextStyle(
                                            fontFamily:
                                              'TimesNewRoman',
                                            fontSize: 15,
                                            fontWeight:
                                              FontWeight.w700,
                                            color:
                                              AppTheme.navy800,
                                          ),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          '${a.serviceType} · ${a.formattedTime}',
                                          style: const TextStyle(
                                            fontFamily:
                                              'TimesNewRoman',
                                            fontSize: 12,
                                            color:
                                              AppTheme.gray500,
                                            fontStyle:
                                              FontStyle.italic,
                                          ),
                                        ),
                                        if (a.vetName != null)
                                          Text(
                                            'Dr. ${a.vetName}',
                                            style: const TextStyle(
                                              fontFamily:
                                                'TimesNewRoman',
                                              fontSize: 12,
                                              color:
                                                AppTheme.navy500,
                                              fontWeight:
                                                FontWeight.w600,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),

                                  // Status
                                  Column(
                                    crossAxisAlignment:
                                      CrossAxisAlignment.end,
                                    children: [
                                      if (sc != null)
                                        Container(
                                          padding:
                                            const EdgeInsets
                                              .symmetric(
                                              horizontal: 10,
                                              vertical: 4,
                                            ),
                                          decoration: BoxDecoration(
                                            color: sc.bg,
                                            borderRadius:
                                              BorderRadius
                                                .circular(20),
                                          ),
                                          child: Text(
                                            a.status,
                                            style: TextStyle(
                                              fontFamily:
                                                'TimesNewRoman',
                                              fontSize: 11,
                                              fontWeight:
                                                FontWeight.w700,
                                              color: sc.color,
                                            ),
                                          ),
                                        ),
                                      const SizedBox(height: 6),
                                      const Icon(
                                        Icons.chevron_right,
                                        color: AppTheme.gray300,
                                        size: 20,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  String _monthAbbr(String date) {
    final months = [
      'JAN','FEB','MAR','APR','MAY','JUN',
      'JUL','AUG','SEP','OCT','NOV','DEC',
    ];
    try {
      final m = int.parse(date.substring(5, 7));
      return months[m - 1];
    } catch (_) { return ''; }
  }
}