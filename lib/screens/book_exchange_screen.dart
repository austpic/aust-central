import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class BookExchangeScreen extends StatelessWidget {
  const BookExchangeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        title: const Text('Book Exchange'),
      ),
      body: const Center(
        child: Text('This is the real Book Exchange page!'),
      ),
    );
  }
}