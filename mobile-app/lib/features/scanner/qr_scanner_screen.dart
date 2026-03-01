import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  MobileScannerController? _controller;
  bool _scanned = false;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_scanned) return;
    final barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      final raw = barcode.rawValue;
      if (raw == null) continue;
      _scanned = true;
      _controller?.stop();
      _showResult(raw);
      break;
    }
  }

  void _showResult(String raw) {
    Map<String, dynamic>? parsed;
    try {
      parsed = jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      parsed = null;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.qr_code, color: AppColors.primary, size: 28),
                const SizedBox(width: 8),
                const Text(
                  'QR Code Scanned',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () {
                    Navigator.pop(context);
                    setState(() => _scanned = false);
                    _controller?.start();
                  },
                ),
              ],
            ),
            const Divider(),
            if (parsed != null && parsed['type'] == 'PETCARE_PLUS_PET') ...[
              _InfoTile('Pet Name', parsed['petName'] as String? ?? '—'),
              _InfoTile('Pet ID', '${parsed['petId']}'),
              _InfoTile('Identifier', parsed['identifier'] as String? ?? '—'),
            ] else ...[
              const Text(
                'Raw Data:',
                style:
                    TextStyle(fontWeight: FontWeight.bold, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 8),
              Text(raw, style: const TextStyle(color: AppColors.textPrimary)),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    ).whenComplete(() {
      if (mounted) {
        setState(() => _scanned = false);
        _controller?.start();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.scanQrCode),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _controller?.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () => _controller?.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, Colors.black54],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: const Text(
                AppStrings.scanQrInstructions,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  const _InfoTile(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label,
                style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
