import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CgpaCalculatorScreen extends StatelessWidget {
  const CgpaCalculatorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        title: const Text('CGPA Calculator'),
      ),
      body: const Center(
        child: Text('This is the real CGPA Calculator page!'),
      ),
    );
  }
}