import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../theme/app_theme.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';

class PetCardWidget extends StatelessWidget {
  final Map<String, dynamic> pet;
  final VoidCallback onTap;

  const PetCardWidget({
    super.key,
    required this.pet,
    required this.onTap,
  });

  String _calculateAge(String? dob) {
    if (dob == null) return 'Unknown age';
    try {
      final birth = DateTime.parse(dob);
      final now = DateTime.now();
      final years = now.year - birth.year;
      final months = now.month - birth.month;
      if (years > 0) return '$years ${AppStrings.years}';
      return '${months < 0 ? 0 : months} ${AppStrings.months}';
    } catch (_) {
      return 'Unknown age';
    }
  }

  Color _speciesColor(String? species) {
    switch (species?.toLowerCase()) {
      case 'dog':
        return AppColors.secondary;
      case 'cat':
        return AppColors.accent;
      case 'bird':
        return AppColors.success;
      default:
        return AppColors.primary;
    }
  }

  IconData _speciesIcon(String? species) {
    switch (species?.toLowerCase()) {
      case 'dog':
      case 'cat':
        return Icons.pets;
      case 'bird':
        return Icons.flutter_dash;
      default:
        return Icons.pets;
    }
  }

  @override
  Widget build(BuildContext context) {
    final species = pet['species'] as String?;
    final color = _speciesColor(species);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(_speciesIcon(species), color: color, size: 32),
              ),
              const SizedBox(width: 16),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pet['name'] as String? ?? '—',
                      style: AppTheme.lightTheme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${species ?? ''} • ${pet['breed'] as String? ?? ''}',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 13),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _calculateAge(pet['date_of_birth'] as String?),
                      style: TextStyle(
                          color: color,
                          fontSize: 12,
                          fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.grey400),
            ],
          ),
        ),
      ),
    );
  }
}
