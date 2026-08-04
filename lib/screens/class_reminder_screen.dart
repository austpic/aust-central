import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class ClassReminderScreen extends StatelessWidget {
  const ClassReminderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        title: const Text('Class Reminder'),
      ),
      body: const Center(
        child: Text('This is the real Class Reminder page!'),
      ),
    );
  }
}