import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/models/app_notification.dart';
import 'package:aust_track/data/repositories/platform_repository.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/viewmodels/notifications_view_model.dart';
import 'package:aust_track/views/widgets/async_views.dart';

/// Notification inbox. Passive view over [NotificationsViewModel].
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => NotificationsViewModel(context.read<PlatformRepository>()),
      child: const _NotificationsView(),
    );
  }
}

class _NotificationsView extends StatelessWidget {
  const _NotificationsView();

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<NotificationsViewModel>();

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        foregroundColor: AppColors.textDark,
        title: const Text('Notifications'),
        actions: [
          if (viewModel.unreadCount > 0)
            TextButton(
              onPressed: viewModel.markAllRead,
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: AsyncContent(
        loading: viewModel.isBusy,
        error: viewModel.errorMessage,
        isEmpty: viewModel.isEmpty,
        onRetry: () => viewModel.load(silent: true),
        emptyView: const EmptyView(
          icon: Icons.notifications_none,
          message: 'No notifications yet',
        ),
        builder: () => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: viewModel.items.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final item = viewModel.items[index];
            return _NotificationTile(
              item: item,
              onTap: () => viewModel.markRead(item),
            );
          },
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification item;
  final VoidCallback onTap;

  const _NotificationTile({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final unread = !item.isRead;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          // Unread rows carry the mint wash so they are distinguishable
          // without relying on font weight alone.
          color: unread ? AppColors.mintSection : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: unread ? AppColors.mintChip : const Color(0x11000000),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: AppColors.mintChip,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(item.kind.icon, size: 20, color: AppColors.darkGreen),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: TextStyle(
                      fontWeight: unread ? FontWeight.w700 : FontWeight.w600,
                      color: AppColors.textDark,
                    ),
                  ),
                  if (item.body.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      item.body,
                      style: const TextStyle(
                          fontSize: 13, color: AppColors.subtitleGrey),
                    ),
                  ],
                  const SizedBox(height: 6),
                  Text(
                    item.relativeTime,
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.subtitleGrey),
                  ),
                ],
              ),
            ),
            if (unread)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 6, left: 6),
                decoration: const BoxDecoration(
                  color: AppColors.darkGreen,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
