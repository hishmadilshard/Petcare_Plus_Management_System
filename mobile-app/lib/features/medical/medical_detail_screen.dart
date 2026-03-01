import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/services/medical_service.dart';
import '../../shared/widgets/loading_widget.dart';

class MedicalDetailScreen extends StatefulWidget {
  final String recordId;
  const MedicalDetailScreen({super.key, required this.recordId});

  @override
  State<MedicalDetailScreen> createState() => _MedicalDetailScreenState();
}

class _MedicalDetailScreenState extends State<MedicalDetailScreen> {
  final MedicalService _service = MedicalService();
  Map<String, dynamic>? _record;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _service.getMedicalRecordById(widget.recordId);
      setState(() {
        _record = data['record'] as Map<String, dynamic>? ?? data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: LoadingWidget());
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text(AppStrings.medicalRecords)),
        body: Center(child: Text(_error!)),
      );
    }

    final r = _record!;
    final vet = r['vet'] as Map<String, dynamic>?;
    final pet = r['pet'] as Map<String, dynamic>?;

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.medicalRecords),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Section(AppStrings.visitDate,
                        _formatDate(r['visit_date'] as String?)),
                    if (pet != null)
                      _Section(AppStrings.pets, pet['name'] as String? ?? '—'),
                    if (vet != null)
                      _Section(AppStrings.recordedBy,
                          'Dr. ${vet['name'] as String? ?? ''}'),
                    const Divider(height: 24),
                    _Section(AppStrings.diagnosis,
                        r['diagnosis'] as String? ?? '—'),
                    _Section(AppStrings.treatment,
                        r['treatment'] as String? ?? '—'),
                    if (r['prescription'] != null)
                      _Section(AppStrings.prescription,
                          r['prescription'] as String),
                    if (r['notes'] != null && (r['notes'] as String).isNotEmpty)
                      _Section(AppStrings.notes, r['notes'] as String),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String? raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('EEEE, MMMM d, y').format(DateTime.parse(raw));
    } catch (_) {
      return raw;
    }
  }
}

class _Section extends StatelessWidget {
  final String label;
  final String value;
  const _Section(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
