import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../theme/app_colors.dart';

class ScanQrCodeScreen extends StatefulWidget {
  const ScanQrCodeScreen({super.key});

  @override
  State<ScanQrCodeScreen> createState() => _ScanQrCodeScreenState();
}

class _ScanQrCodeScreenState extends State<ScanQrCodeScreen> {
  String _qrResult = 'Scanned Data Will Appear Here';
  bool _isScanned = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.textDark),
        title: const Text(
          "QR Code Scanner",
          style: TextStyle(
            color: AppColors.darkGreen,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: MobileScanner(
              onDetect: (capture) {
                if (_isScanned) return;
                final barcodes = capture.barcodes;
                if (barcodes.isNotEmpty) {
                  final value = barcodes.first.rawValue;
                  setState(() {
                    _qrResult = value ?? 'No data found';
                    _isScanned = true;
                  });
                }
              },
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: AppColors.scaffoldBackground,
            child: Text(
              _qrResult,
              style: const TextStyle(
                color: AppColors.darkGreen,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}
