import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class TransportationScreen extends StatelessWidget {
  const TransportationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        title: const Text('Transport'),
      ),
      body: const Center(
        child: Text('This is the real Transportation page!'),
      ),
    );
  }
}