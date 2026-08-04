import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class NoticeBoardScreen extends StatelessWidget {
  const NoticeBoardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        title: const Text('Notice Board'),
      ),
      body: const Center(
        child: Text('This is the real Notice Board page!'),
      ),
    );
  }
}