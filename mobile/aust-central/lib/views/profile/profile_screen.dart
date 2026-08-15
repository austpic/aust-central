import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/services/auth_service.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/views/auth/welcome_screen.dart';

/// User profile.
///
/// Reads from [AuthService] rather than Firebase, and now also carries the
/// sign-out action — which the app previously had no way to reach at all.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _signOut(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text('You will need to sign in again to use the app.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    await context.read<AuthService>().signOut();
    if (!context.mounted) return;

    // Clear the whole stack: leaving the dashboard behind a signed-out session
    // would let Back walk into screens that can no longer load anything.
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const WelcomeScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    // Watched, so editing the profile elsewhere refreshes this screen.
    final user = context.watch<AuthService>().currentUser;

    final name = (user?.name.trim().isNotEmpty ?? false) ? user!.name : 'AUST Student';
    final email = user?.email ?? 'No email available';

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        title: const Text('User Profile'),
        centerTitle: true,
        backgroundColor: AppColors.scaffoldBackground,
        foregroundColor: AppColors.darkGreen,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: CircleAvatar(
              radius: 48,
              backgroundColor: AppColors.mintChip,
              child: Text(
                name.substring(0, 1).toUpperCase(),
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: AppColors.darkGreen,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              name,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Center(
            child: Text(email, style: const TextStyle(color: AppColors.subtitleGrey)),
          ),
          if (user != null && !user.emailVerified) ...[
            const SizedBox(height: 12),
            Center(
              child: Chip(
                avatar: const Icon(Icons.mark_email_unread_outlined, size: 18),
                label: const Text('Email not verified'),
                backgroundColor: AppColors.mintChip,
              ),
            ),
          ],
          const SizedBox(height: 28),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.person_outline),
                  title: const Text('Name'),
                  subtitle: Text(name),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.email_outlined),
                  title: const Text('Email'),
                  subtitle: Text(email),
                ),
                if (user?.studentId != null) ...[
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.badge_outlined),
                    title: const Text('Student ID'),
                    subtitle: Text(user!.studentId!),
                  ),
                ],
                if (user?.department != null) ...[
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.school_outlined),
                    title: const Text('Department'),
                    subtitle: Text(user!.department!),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () => _signOut(context),
            icon: const Icon(Icons.logout),
            label: const Text('Sign out'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.danger,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ],
      ),
    );
  }
}
