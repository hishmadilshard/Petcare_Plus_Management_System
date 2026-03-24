// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../config/app_theme.dart';
import '../../models/pet_model.dart';

class QrDisplayScreen extends StatelessWidget {
  final PetModel pet;
  const QrDisplayScreen({super.key, required this.pet});

  @override
  Widget build(BuildContext context) {
    final qrData = pet.qrCode ??
        'PetCare Plus | Pet ID: ${pet.petId} | ${pet.petName}';

    return Scaffold(
      backgroundColor: AppTheme.navy900,
      appBar: AppBar(
        backgroundColor: AppTheme.navy900,
        title: Text('${pet.petName}\'s QR Code'),
        elevation: 0,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [

              // Pet Info
              Text(
                pet.speciesIcon,
                style: const TextStyle(fontSize: 52),
              ),
              const SizedBox(height: 12),
              Text(
                pet.petName,
                style: const TextStyle(
                  fontFamily: 'TimesNewRoman',
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  fontStyle: FontStyle.italic,
                ),
              ),
              Text(
                '${pet.species}${pet.breed != null ? " · ${pet.breed}" : ""}',
                style: TextStyle(
                  fontFamily: 'TimesNewRoman',
                  fontSize: 14,
                  color: Colors.white.withOpacity(0.55),
                  fontStyle: FontStyle.italic,
                ),
              ),
              const SizedBox(height: 36),

              // QR Code
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: QrImageView(
                  data: qrData,
                  version: QrVersions.auto,
                  size: 220,
                  backgroundColor: Colors.white,
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: AppTheme.navy900,
                  ),
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: AppTheme.navy800,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Hint
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20, vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.15),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.info_outline,
                      color: Colors.white.withOpacity(0.6),
                      size: 16),
                    const SizedBox(width: 8),
                    Text(
                      'Scan to view pet profile',
                      style: TextStyle(
                        fontFamily: 'TimesNewRoman',
                        fontSize: 13,
                        color: Colors.white.withOpacity(0.6),
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),

              if (pet.microchipId != null) ...[
                const SizedBox(height: 16),
                Text(
                  '🔖 Microchip: ${pet.microchipId}',
                  style: TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.5),
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}