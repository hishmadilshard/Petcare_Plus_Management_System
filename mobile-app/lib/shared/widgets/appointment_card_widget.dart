import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_colors.dart';

class AppointmentCardWidget extends StatelessWidget {
  final Map<String, dynamic> appointment;
  final VoidCallback onTap;

  const AppointmentCardWidget({
    super.key,
    required this.appointment,
    required this.onTap,
  });

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

  String _formatDate(String? raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('EEE, MMM d, y').format(DateTime.parse(raw));
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    final a = appointment;
    final status = a['status'] as String? ?? '';
    final pet = a['pet'] as Map<String, dynamic>?;
    final vet = a['vet'] as Map<String, dynamic>?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      a['service_type'] as String? ?? 'Appointment',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  Chip(
                    label: Text(
                      status.toUpperCase(),
                      style:
                          const TextStyle(color: Colors.white, fontSize: 10),
                    ),
                    backgroundColor: _statusColor(status),
                    padding: EdgeInsets.zero,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.calendar_today,
                      size: 14, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(a['appointment_date'] as String?),
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 13),
                  ),
                  if (a['appointment_time'] != null) ...[
                    const SizedBox(width: 12),
                    const Icon(Icons.access_time,
                        size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      a['appointment_time'] as String,
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 13),
                    ),
                  ],
                ],
              ),
              if (pet != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.pets,
                        size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      pet['name'] as String? ?? '',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ],
              if (vet != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.person_outlined,
                        size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      'Dr. ${vet['name'] as String? ?? ''}',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
