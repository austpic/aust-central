import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class TodoListScreen extends StatelessWidget {
  const TodoListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        title: const Text('To-do List'),
      ),
      body: const Center(
        child: Text('This is the real To-do List page!'),
      ),
    );
  }
}