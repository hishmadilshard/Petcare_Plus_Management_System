// ignore_for_file: duplicate_ignore, deprecated_member_use

import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../config/app_theme.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() =>
      _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  MobileScannerController controller =
      MobileScannerController();
  bool _scanned = false;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('🔲  Scan QR Code'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () => controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [

          // Scanner
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              if (_scanned) return;
              final barcode = capture.barcodes.firstOrNull;
              if (barcode?.rawValue != null) {
                setState(() => _scanned = true);
                controller.stop();
                _showResult(
                  context, barcode!.rawValue!,
                );
              }
            },
          ),

          // Overlay
          Center(
            child: Container(
              width: 260, height: 260,
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppTheme.navy300,
                  width: 3,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Stack(
                children: [
                  // Corner decorations
                  ..._corners(),
                ],
              ),
            ),
          ),

          // Instructions
          Positioned(
            bottom: 60,
            left: 0, right: 0,
            child: Column(
              children: [
                Text(
                  'Point camera at QR code',
                  style: TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 16,
                    // ignore: deprecated_member_use
                    color: Colors.white.withOpacity(0.8),
                    fontStyle: FontStyle.italic,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Pet profile will open automatically',
                  style: TextStyle(
                    fontFamily: 'TimesNewRoman',
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.45),
                    fontStyle: FontStyle.italic,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _corners() {
    const size = 28.0;
    const thick = 3.5;
    const color = AppTheme.navy300;

    Widget corner(Alignment a) => Align(
      alignment: a,
      child: Container(
        width: size, height: size,
        decoration: BoxDecoration(
          border: Border(
            top: a.y < 0
              ? const BorderSide(color: color, width: thick)
              : BorderSide.none,
            bottom: a.y > 0
              ? const BorderSide(color: color, width: thick)
              : BorderSide.none,
            left: a.x < 0
              ? const BorderSide(color: color, width: thick)
              : BorderSide.none,
            right: a.x > 0
              ? const BorderSide(color: color, width: thick)
              : BorderSide.none,
          ),
        ),
      ),
    );

    return [
      corner(Alignment.topLeft),
      corner(Alignment.topRight),
      corner(Alignment.bottomLeft),
      corner(Alignment.bottomRight),
    ];
  }

  void _showResult(BuildContext context, String value) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(24),
          ),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: AppTheme.gray200,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
            const SizedBox(height: 20),
            const Text('🔲', style: TextStyle(fontSize: 40)),
            const SizedBox(height: 12),
            const Text(
              'QR Code Scanned!',
              style: TextStyle(
                fontFamily: 'TimesNewRoman',
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.navy800,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.navy50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.navy100),
              ),
              child: Text(
                value,
                style: const TextStyle(
                  fontFamily: 'TimesNewRoman',
                  fontSize: 13,
                  color: AppTheme.navy700,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  setState(() => _scanned = false);
                  controller.start();
                },
                child: const Text('Scan Again'),
              ),
            ),
          ],
        ),
      ),
    ).then((_) {
      if (mounted && _scanned) {
        setState(() => _scanned = false);
        controller.start();
      }
    });
  }
}