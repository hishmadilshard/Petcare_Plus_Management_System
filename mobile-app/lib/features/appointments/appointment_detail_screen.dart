import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/services/appointment_service.dart';
import '../../shared/widgets/loading_widget.dart';

class AppointmentDetailScreen extends StatefulWidget {
  final String appointmentId;
  const AppointmentDetailScreen({super.key, required this.appointmentId});

  @override
  State<AppointmentDetailScreen> createState() =>
      _AppointmentDetailScreenState();
}

class _AppointmentDetailScreenState extends State<AppointmentDetailScreen> {
  final AppointmentService _service = AppointmentService();
  Map<String, dynamic>? _appointment;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _service.getAppointmentById(widget.appointmentId);
      setState(() {
        _appointment =
            data['appointment'] as Map<String, dynamic>? ?? data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return AppColors.statusScheduled;
      case 'confirmed':
        return AppColors.statusConfirmed;
      case 'completed':
        return AppColors.statusCompleted;
      case 'cancelled':
        return AppColors.statusCancelled;
      default:
        return AppColors.statusNoShow;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: LoadingWidget());
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text(AppStrings.appointmentDetails)),
        body: Center(child: Text(_error!)),
      );
    }

    final a = _appointment!;
    final status = a['status'] as String? ?? '';
    final pet = a['pet'] as Map<String, dynamic>?;
    final vet = a['vet'] as Map<String, dynamic>?;

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.appointmentDetails),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      a['service_type'] as String? ?? '—',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                    Chip(
                      label: Text(
                        status.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                      backgroundColor: _statusColor(status),
                    ),
                  ],
                ),
                const Divider(height: 24),
                _DetailRow(AppStrings.date, _formatDate(a['appointment_date'] as String?)),
                _DetailRow(AppStrings.time, a['appointment_time'] as String? ?? '—'),
                if (pet != null)
                  _DetailRow(AppStrings.pets, pet['name'] as String? ?? '—'),
                if (vet != null)
                  _DetailRow(AppStrings.vet, 'Dr. ${vet['name'] as String? ?? ''}'),
                if (a['notes'] != null && (a['notes'] as String).isNotEmpty)
                  _DetailRow(AppStrings.notes, a['notes'] as String),
              ],
            ),
          ),
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

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
