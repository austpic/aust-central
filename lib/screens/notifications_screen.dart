import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        title: const Text('Notifications'),
      ),
      body: const Center(
        child: Text('This is the real Notifications page!'),
      ),
    );
  }
}