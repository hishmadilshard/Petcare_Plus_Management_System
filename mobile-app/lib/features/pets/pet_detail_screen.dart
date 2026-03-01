import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/services/pet_service.dart';
import '../../shared/widgets/loading_widget.dart';

class PetDetailScreen extends StatefulWidget {
  final String petId;
  const PetDetailScreen({super.key, required this.petId});

  @override
  State<PetDetailScreen> createState() => _PetDetailScreenState();
}

class _PetDetailScreenState extends State<PetDetailScreen> {
  final PetService _petService = PetService();
  Map<String, dynamic>? _pet;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPet();
  }

  Future<void> _loadPet() async {
    setState(() => _isLoading = true);
    try {
      final pet = await _petService.getPetById(widget.petId);
      setState(() {
        _pet = pet['pet'] as Map<String, dynamic>? ?? pet;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  String _calculateAge(String? dob) {
    if (dob == null) return 'Unknown';
    try {
      final birth = DateTime.parse(dob);
      final now = DateTime.now();
      final years = now.year - birth.year;
      final months = now.month - birth.month;
      if (years > 0) return '$years ${AppStrings.years}';
      return '${months < 0 ? 0 : months} ${AppStrings.months}';
    } catch (_) {
      return 'Unknown';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: LoadingWidget());
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text(AppStrings.petDetails)),
        body: Center(child: Text(_error!)),
      );
    }
    final pet = _pet!;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(pet['name'] as String? ?? ''),
              background: Container(
                color: AppColors.primary,
                child: const Center(
                  child: Icon(Icons.pets, size: 80, color: Colors.white54),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _InfoCard(
                  children: [
                    _InfoRow(AppStrings.species, pet['species'] as String? ?? '—'),
                    _InfoRow(AppStrings.breed, pet['breed'] as String? ?? '—'),
                    _InfoRow(AppStrings.gender, pet['gender'] as String? ?? '—'),
                    _InfoRow(AppStrings.color, pet['color'] as String? ?? '—'),
                    _InfoRow(
                      AppStrings.dateOfBirth,
                      pet['date_of_birth'] != null
                          ? DateFormat('MMM d, y')
                              .format(DateTime.parse(pet['date_of_birth'] as String))
                          : '—',
                    ),
                    _InfoRow(AppStrings.age, _calculateAge(pet['date_of_birth'] as String?)),
                    _InfoRow(
                      AppStrings.weight,
                      pet['weight'] != null
                          ? '${pet['weight']} ${AppStrings.kg}'
                          : '—',
                    ),
                    if (pet['microchip_id'] != null)
                      _InfoRow(AppStrings.microchipId, pet['microchip_id'] as String),
                  ],
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  icon: const Icon(Icons.qr_code),
                  label: const Text(AppStrings.viewQrCode),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () =>
                      context.push('/pets/${widget.petId}/qr'),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  icon: const Icon(Icons.medical_services_outlined),
                  label: const Text(AppStrings.medicalHistory),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () =>
                      context.push('/medical-records?petId=${widget.petId}'),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  icon: const Icon(Icons.calendar_month),
                  label: const Text(AppStrings.bookAppointment),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.success,
                    side: const BorderSide(color: AppColors.success),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => context.push('/appointments/book'),
                ),
                const SizedBox(height: 24),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final List<Widget> children;
  const _InfoCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: children),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
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
