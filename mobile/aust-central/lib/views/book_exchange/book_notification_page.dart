import 'package:flutter/material.dart';
// Fixed import path (going up 2 directories to lib/theme/)
import 'package:aust_track/theme/app_colors.dart';

class BookNotificationPage extends StatelessWidget {
  const BookNotificationPage({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: replace with real notifications from backend/state
    final notifications = <Map<String, String>>[
      {
        'title': 'New message',
        'body': 'Shahidul Islam Arman replied to you',
      },
      {
        'title': 'Listing saved',
        'body': 'Someone bookmarked your CHEM 201 book',
      },
    ];

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.darkGreen),
        title: const Text(
          'Notifications',
          style: TextStyle(
            color: AppColors.darkGreen,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: SafeArea(
        child: notifications.isEmpty
            ? const Center(
          child: Text(
            'No notifications yet',
            style: TextStyle(color: Colors.black45),
          ),
        )
            : ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: notifications.length,
          // Fixed underscore usage in separatorBuilder
          separatorBuilder: (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final n = notifications[index];
            return Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.mintSection),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 18,
                    backgroundColor: AppColors.mintChip,
                    child: Icon(
                      Icons.notifications_rounded,
                      color: AppColors.darkGreen,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          n['title']!,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          n['body']!,
                          style: const TextStyle(
                            color: Colors.black54,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}