import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/services/pet_service.dart';
import '../../shared/widgets/loading_widget.dart';
import '../../shared/widgets/qr_display_widget.dart';

class PetQrScreen extends StatefulWidget {
  final String petId;
  const PetQrScreen({super.key, required this.petId});

  @override
  State<PetQrScreen> createState() => _PetQrScreenState();
}

class _PetQrScreenState extends State<PetQrScreen> {
  final PetService _petService = PetService();
  Map<String, dynamic>? _pet;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPet();
  }

  Future<void> _loadPet() async {
    try {
      final data = await _petService.getPetById(widget.petId);
      setState(() {
        _pet = data['pet'] as Map<String, dynamic>? ?? data;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  String _buildQrPayload() {
    final pet = _pet;
    if (pet == null) return '';
    final payload = {
      'type': 'PETCARE_PLUS_PET',
      'version': '1.0',
      'petId': pet['id'],
      'ownerId': pet['owner_id'],
      'identifier': 'pet-${pet['id']}',
      'petName': pet['name'],
    };
    return jsonEncode(payload);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.petQrCode),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      backgroundColor: AppColors.background,
      body: _isLoading
          ? const LoadingWidget()
          : Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _pet?['name'] as String? ?? 'Pet',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      AppStrings.qrInstructions,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 32),
                    Card(
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: QrDisplayWidget(data: _buildQrPayload()),
                      ),
                    ),
                    const SizedBox(height: 32),
                    ElevatedButton.icon(
                      icon: const Icon(Icons.share),
                      label: const Text(AppStrings.shareQr),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 14,
                        ),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        Share.share(
                          'PetCare Plus QR Code for ${_pet?['name']}\n\n${_buildQrPayload()}',
                          subject: 'Pet QR Code',
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
