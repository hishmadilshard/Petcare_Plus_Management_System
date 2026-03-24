// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../models/pet_model.dart';
import 'medical_history_screen.dart';
import '../qr/qr_display_screen.dart';

class PetProfileScreen extends StatelessWidget {
  final PetModel pet;
  const PetProfileScreen({super.key, required this.pet});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.gray50,
      body: CustomScrollView(
        slivers: [

          // ── Hero App Bar ───────────────────────
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: AppTheme.navy800,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end:   Alignment.bottomRight,
                    colors: [
                      AppTheme.navy900,
                      AppTheme.navy700,
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment:
                        MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      // Pet Avatar
                      Container(
                        width: 90, height: 90,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius:
                              BorderRadius.circular(26),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                            width: 2,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            pet.speciesIcon,
                            style: const TextStyle(fontSize: 48),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        pet.petName,
                        style: const TextStyle(
                          fontFamily: 'TimesNewRoman',
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${pet.species}${pet.breed != null ? " · ${pet.breed}" : ""}',
                        style: TextStyle(
                          fontFamily: 'TimesNewRoman',
                          fontSize: 13,
                          color: Colors.white.withOpacity(0.65),
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── Body ───────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [

                  // Action Buttons
                  Row(children: [
                    Expanded(
                      child: _ActionBtn(
                        icon: '📋',
                        label: 'Medical History',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                              MedicalHistoryScreen(pet: pet),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _ActionBtn(
                        icon: '🔲',
                        label: 'QR Code',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                              QrDisplayScreen(pet: pet),
                          ),
                        ),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 20),

                  // Details Card
                  _SectionCard(
                    title: '🐾 Pet Details',
                    child: Column(
                      children: [
                        _InfoRow('Name',    pet.petName),
                        _InfoRow('Species', pet.species),
                        if (pet.breed != null)
                          _InfoRow('Breed', pet.breed!),
                        _InfoRow('Gender',  pet.gender),
                        if (pet.age != null)
                          _InfoRow('Age',
                            '${pet.age} years'),
                        if (pet.weight != null)
                          _InfoRow('Weight',
                            '${pet.weight} kg'),
                        if (pet.color != null)
                          _InfoRow('Color', pet.color!),
                        if (pet.dateOfBirth != null)
                          _InfoRow('Date of Birth',
                            pet.dateOfBirth!.substring(0, 10)),
                        if (pet.microchipId != null)
                          _InfoRow('Microchip ID',
                            pet.microchipId!),
                        _InfoRow('Status', pet.status),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Owner Card
                  if (pet.ownerName != null)
                    _SectionCard(
                      title: '👤 Owner Details',
                      child: Column(
                        children: [
                          _InfoRow('Owner',   pet.ownerName!),
                          if (pet.ownerPhone != null)
                            _InfoRow('Phone', pet.ownerPhone!),
                          if (pet.branchName != null)
                            _InfoRow('Branch', pet.branchName!),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),

                  // Health Notes
                  if (pet.allergies != null ||
                      pet.specialNotes != null)
                    _SectionCard(
                      title: '🏥 Health Notes',
                      child: Column(
                        children: [
                          if (pet.allergies != null)
                            _InfoRow('Allergies',
                              pet.allergies!),
                          if (pet.specialNotes != null)
                            _InfoRow('Special Notes',
                              pet.specialNotes!),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Action Button ─────────────────────────────────────────
class _ActionBtn extends StatelessWidget {
  final String icon;
  final String label;
  final VoidCallback onTap;

  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppTheme.navy50,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.navy100),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 26)),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'TimesNewRoman',
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppTheme.navy700,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Section Card ──────────────────────────────────────────
class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  const _SectionCard({required this.title, required this.child});

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
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 10),
            child: Text(
              title,
              style: const TextStyle(
                fontFamily: 'TimesNewRoman',
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.navy800,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
          const Divider(height: 1, color: AppTheme.gray100),
          Padding(
            padding: const EdgeInsets.all(18),
            child: child,
          ),
        ],
      ),
    );
  }
}

// ── Info Row ──────────────────────────────────────────────
class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
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
              value,
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
    );
  }
}