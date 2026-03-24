// ignore_for_file: prefer_const_constructors, curly_braces_in_flow_control_structures, deprecated_member_use

import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/api_config.dart';
import '../../models/pet_model.dart';
import '../../services/api_service.dart';

class MedicalHistoryScreen extends StatefulWidget {
  final PetModel pet;
  const MedicalHistoryScreen({super.key, required this.pet});

  @override
  State<MedicalHistoryScreen> createState() =>
      _MedicalHistoryScreenState();
}

class _MedicalHistoryScreenState
    extends State<MedicalHistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  List<dynamic> _records      = [];
  List<dynamic> _vaccinations = [];
  bool _loadingRecords      = true;
  bool _loadingVaccinations = true;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _loadRecords();
    _loadVaccinations();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadRecords() async {
    try {
      final res = await ApiService.get(
        '${ApiConfig.medical}/pet/${widget.pet.petId}',
        params: {'limit': '50'},
      );
      setState(() {
        _records        = res['data'] ?? [];
        _loadingRecords = false;
      });
    } catch (_) {
      setState(() => _loadingRecords = false);
    }
  }

  Future<void> _loadVaccinations() async {
    try {
      final res = await ApiService.get(
        '${ApiConfig.vaccinations}/pet/${widget.pet.petId}',
      );
      setState(() {
        _vaccinations        = res['data'] ?? [];
        _loadingVaccinations = false;
      });
    } catch (_) {
      setState(() => _loadingVaccinations = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.gray50,
      appBar: AppBar(
        backgroundColor: AppTheme.navy800,
        title: Text(
          '${widget.pet.petName}\'s Medical History',
        ),
        bottom: TabBar(
          controller: _tabCtrl,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor:
              Colors.white.withOpacity(0.55),
          labelStyle: const TextStyle(
            fontFamily: 'TimesNewRoman',
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
          tabs: const [
            Tab(text: '📋  Medical Records'),
            Tab(text: '💉  Vaccinations'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          _MedicalRecordsTab(
            records: _records,
            loading: _loadingRecords,
          ),
          _VaccinationsTab(
            vaccinations: _vaccinations,
            loading: _loadingVaccinations,
          ),
        ],
      ),
    );
  }
}

// ── Medical Records Tab ───────────────────────────────────
class _MedicalRecordsTab extends StatelessWidget {
  final List<dynamic> records;
  final bool loading;
  const _MedicalRecordsTab({
    required this.records, required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(
      child: CircularProgressIndicator());

    if (records.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('📋', style: TextStyle(fontSize: 52)),
            SizedBox(height: 14),
            Text(
              'No medical records found',
              style: TextStyle(
                fontFamily: 'TimesNewRoman',
                fontSize: 16, color: AppTheme.gray500,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: records.length,
      itemBuilder: (_, i) {
        final r = records[i] as Map<String, dynamic>;
        return Container(
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.gray100),
            boxShadow: [
              BoxShadow(
                color: AppTheme.navy900.withOpacity(0.05),
                blurRadius: 10,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(14),
                decoration: const BoxDecoration(
                  color: AppTheme.navy50,
                  borderRadius: BorderRadius.only(
                    topLeft:  Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.medical_services_outlined,
                      color: AppTheme.navy600, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      r['record_date']
                              ?.toString().substring(0, 10)
                          ?? '—',
                      style: const TextStyle(
                        fontFamily: 'TimesNewRoman',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.navy700,
                      ),
                    ),
                    const Spacer(),
                    if (r['vet_name'] != null)
                      Text(
                        'Dr. ${r['vet_name']}',
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

              // Content
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    if (r['diagnosis'] != null)
                      _MedRow(
                        icon: '🔍',
                        label: 'Diagnosis',
                        value: r['diagnosis'],
                      ),
                    if (r['treatment'] != null)
                      _MedRow(
                        icon: '💊',
                        label: 'Treatment',
                        value: r['treatment'],
                      ),
                    if (r['prescriptions'] != null)
                      _MedRow(
                        icon: '📝',
                        label: 'Prescriptions',
                        value: r['prescriptions'],
                      ),
                    if (r['next_due_date'] != null)
                      _MedRow(
                        icon: '📅',
                        label: 'Next Visit',
                        value: r['next_due_date']
                            .toString().substring(0, 10),
                        highlight: true,
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MedRow extends StatelessWidget {
  final String icon;
  final String label;
  final dynamic value;
  final bool highlight;

  const _MedRow({
    required this.icon,
    required this.label,
    required this.value,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 8),
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(
                fontFamily: 'TimesNewRoman',
                fontSize: 12,
                color: AppTheme.gray500,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value?.toString() ?? '—',
              style: TextStyle(
                fontFamily: 'TimesNewRoman',
                fontSize: 13,
                color: highlight
                  ? AppTheme.warning : AppTheme.navy800,
                fontWeight: highlight
                  ? FontWeight.w700 : FontWeight.w600,
                fontStyle: highlight
                  ? FontStyle.italic : FontStyle.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Vaccinations Tab ──────────────────────────────────────
class _VaccinationsTab extends StatelessWidget {
  final List<dynamic> vaccinations;
  final bool loading;
  const _VaccinationsTab({
    required this.vaccinations, required this.loading,
  });

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(
      child: CircularProgressIndicator());

    if (vaccinations.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('💉', style: TextStyle(fontSize: 52)),
            SizedBox(height: 14),
            Text(
              'No vaccination records found',
              style: TextStyle(
                fontFamily: 'TimesNewRoman',
                fontSize: 16,
                color: AppTheme.gray500,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: vaccinations.length,
      itemBuilder: (_, i) {
        final v = vaccinations[i] as Map<String, dynamic>;
        final nextDue = v['next_due_date'];
        final isOverdue = nextDue != null &&
            DateTime.tryParse(nextDue.toString())
                ?.isBefore(DateTime.now()) == true;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isOverdue
                ? const Color(0xFFFECACA)
                : AppTheme.gray100,
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.navy900.withOpacity(0.04),
                blurRadius: 8,
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: isOverdue
                    ? const Color(0xFFFEF2F2)
                    : const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text('💉',
                    style: const TextStyle(fontSize: 22)),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Text(
                      v['vaccine_name']?.toString() ?? '—',
                      style: const TextStyle(
                        fontFamily: 'TimesNewRoman',
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.navy800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Given: ${v['vaccination_date']?.toString().substring(0, 10) ?? "—"}',
                      style: const TextStyle(
                        fontFamily: 'TimesNewRoman',
                        fontSize: 12,
                        color: AppTheme.gray500,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    if (nextDue != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Due: ${nextDue.toString().substring(0, 10)}',
                        style: TextStyle(
                          fontFamily: 'TimesNewRoman',
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: isOverdue
                            ? AppTheme.danger
                            : AppTheme.success,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10, vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: isOverdue
                    ? const Color(0xFFFEF2F2)
                    : const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  isOverdue ? '⚠️ Overdue' : '✅ Done',
                  style: TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isOverdue
                      ? AppTheme.danger
                      : AppTheme.success,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}