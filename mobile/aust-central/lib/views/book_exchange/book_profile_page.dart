import 'package:flutter/material.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/views/widgets/avatars.dart';

class BookProfilePage extends StatelessWidget {
  const BookProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.darkGreen),
        title: const Text(
          'My Profile',
          style: TextStyle(color: AppColors.darkGreen, fontWeight: FontWeight.w800),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Center(
              child: InitialsAvatar(name: 'Your Name', radius: 44),
            ),
            const SizedBox(height: 14),
            const Center(
              child: Text(
                'Your Name',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ),
            const SizedBox(height: 4),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.star_rounded, size: 16, color: AppColors.warning),
                  SizedBox(width: 4),
                  Text('4.9', style: TextStyle(color: Colors.black54)),
                ],
              ),
            ),
            const SizedBox(height: 28),
            _sectionTile(icon: Icons.menu_book_rounded, label: 'My Listings', onTap: () {
              // TODO: navigate to user's own listings
            }),
            const SizedBox(height: 12),
            _sectionTile(icon: Icons.bookmark_rounded, label: 'Saved Books', onTap: () {
              // TODO: navigate to bookmarked listings (wire to shared bookmark state)
            }),
            const SizedBox(height: 12),
            _sectionTile(icon: Icons.history_rounded, label: 'Exchange History', onTap: () {
              // TODO: navigate to past exchanges
            }),
            const SizedBox(height: 12),
            _sectionTile(icon: Icons.settings_rounded, label: 'Settings', onTap: () {
              // TODO: navigate to settings
            }),
          ],
        ),
      ),
    );
  }

  Widget _sectionTile({required IconData icon, required String label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.mintSection),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.darkGreen, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
            const Icon(Icons.chevron_right_rounded, color: Colors.black38),
          ],
        ),
      ),
    );
  }
}
