import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/services/medical_service.dart';
import '../../shared/widgets/loading_widget.dart';

class MedicalRecordsScreen extends StatefulWidget {
  final String? petId;
  const MedicalRecordsScreen({super.key, this.petId});

  @override
  State<MedicalRecordsScreen> createState() => _MedicalRecordsScreenState();
}

class _MedicalRecordsScreenState extends State<MedicalRecordsScreen> {
  final MedicalService _service = MedicalService();
  List<dynamic> _records = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      _records = await _service.getMedicalRecords(petId: widget.petId);
    } catch (e) {
      _error = e.toString();
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.medicalRecords),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _isLoading
            ? const LoadingWidget()
            : _error != null
                ? Center(child: Text(_error!))
                : _records.isEmpty
                    ? const Center(
                        child: Text(AppStrings.noMedicalRecords,
                            style:
                                TextStyle(color: AppColors.textSecondary)),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _records.length,
                        itemBuilder: (context, index) {
                          final record =
                              _records[index] as Map<String, dynamic>;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              leading: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppColors.accent.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.medical_services_outlined,
                                  color: AppColors.accent,
                                ),
                              ),
                              title: Text(
                                record['diagnosis'] as String? ?? 'Record',
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold),
                              ),
                              subtitle: Text(
                                _formatDate(
                                    record['visit_date'] as String?),
                                style: const TextStyle(
                                    color: AppColors.textSecondary),
                              ),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () =>
                                  context.push('/medical-records/${record['id']}'),
                            ),
                          );
                        },
                      ),
      ),
    );
  }

  String _formatDate(String? raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('MMM d, y').format(DateTime.parse(raw));
    } catch (_) {
      return raw;
    }
  }
}
