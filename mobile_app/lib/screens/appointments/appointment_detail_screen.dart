// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/api_config.dart';
import '../../models/appointment_model.dart';
import '../../services/api_service.dart';

class AppointmentDetailScreen extends StatelessWidget {
  final AppointmentModel appointment;
  const AppointmentDetailScreen({
    super.key, required this.appointment,
  });

  @override
  Widget build(BuildContext context) {
    final a = appointment;
    return Scaffold(
      backgroundColor: AppTheme.gray50,
      appBar: AppBar(
        backgroundColor: AppTheme.navy800,
        title: const Text('📅  Appointment Details'),
        actions: [
          if (a.status == 'Scheduled')
            TextButton(
              onPressed: () => _cancelDialog(context),
              child: const Text(
                'Cancel',
                style: TextStyle(
                  color: Colors.redAccent,
                  fontFamily: 'TimesNewRoman',
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [

            // Status Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    AppTheme.navy900, AppTheme.navy800,
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  const Text('📅',
                    style: TextStyle(fontSize: 40)),
                  const SizedBox(height: 10),
                  Text(
                    a.serviceType,
                    style: const TextStyle(
                      fontFamily: 'TimesNewRoman',
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      a.status,
                      style: const TextStyle(
                        fontFamily: 'TimesNewRoman',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Details
            _DetailCard(
              title: '📋 Appointment Info',
              rows: [
                ('Date',     a.formattedDate),
                ('Time',     a.formattedTime),
                ('Service',  a.serviceType),
                ('Status',   a.status),
                if (a.branchName != null)
                  ('Branch', a.branchName!),
              ],
            ),
            const SizedBox(height: 14),

            _DetailCard(
              title: '🐾 Pet & Owner',
              rows: [
                if (a.petName != null)
                  ('Pet',   a.petName!),
                if (a.species != null)
                  ('Species', a.species!),
                if (a.ownerName != null)
                  ('Owner', a.ownerName!),
              ],
            ),
            const SizedBox(height: 14),

            if (a.vetName != null)
              _DetailCard(
                title: '🩺 Veterinarian',
                rows: [
                  ('Vet', 'Dr. ${a.vetName!}'),
                ],
              ),
            const SizedBox(height: 14),

            if (a.notes != null && a.notes!.isNotEmpty)
              _DetailCard(
                title: '📝 Notes',
                rows: [('Notes', a.notes!)],
              ),
          ],
        ),
      ),
    );
  }

  void _cancelDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Cancel Appointment',
          style: TextStyle(
            fontFamily: 'TimesNewRoman',
            fontWeight: FontWeight.w700,
          ),
        ),
        content: const Text(
          'Are you sure you want to cancel this appointment?',
          style: TextStyle(fontFamily: 'TimesNewRoman'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No',
              style: TextStyle(fontFamily: 'TimesNewRoman')),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.danger,
            ),
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ApiService.patch(
                  '${ApiConfig.appointments}/${appointment.appointmentId}/cancel',
                  {},
                );
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Appointment cancelled.',
                        style: TextStyle(
                          fontFamily: 'TimesNewRoman')),
                      backgroundColor: AppTheme.warning,
                    ),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(e.toString(),
                        style: const TextStyle(
                          fontFamily: 'TimesNewRoman')),
                      backgroundColor: AppTheme.danger,
                    ),
                  );
                }
              }
            },
            child: const Text('Yes, Cancel',
              style: TextStyle(fontFamily: 'TimesNewRoman')),
          ),
        ],
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  final String title;
  final List<(String, String)> rows;
  const _DetailCard({required this.title, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
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
          Padding(
            padding: const EdgeInsets.fromLTRB(
              16, 14, 16, 10),
            child: Text(
              title,
              style: const TextStyle(
                fontFamily: 'TimesNewRoman',
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.navy800,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
          const Divider(height: 1, color: AppTheme.gray100),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: rows.map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 80,
                      child: Text(
                        r.$1,
                        style: const TextStyle(
                          fontFamily: 'TimesNewRoman',
                          fontSize: 13,
                          color: AppTheme.gray500,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        r.$2,
                        style: const TextStyle(
                          fontFamily: 'TimesNewRoman',
                          fontSize: 13,
                          color: AppTheme.navy800,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              )).toList(),
            ),
          ),
        ],
      ),
    );
  }
}