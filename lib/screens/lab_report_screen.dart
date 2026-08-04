import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class LabReportScreen extends StatelessWidget {
  const LabReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        title: const Text('Lab Report Generator'),
      ),
      body: const Center(
        child: Text('This is the real Lab Report Generator page!'),
      ),
    );
  }
}