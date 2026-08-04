import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class BloodBankScreen extends StatelessWidget {
  const BloodBankScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        title: const Text('Blood Bank'),
      ),
      body: const Center(
        child: Text('This is the real Blood Bank page!'),
      ),
    );
  }
}