import 'package:flutter/material.dart';

/// Categories the server can send. Drives the icon shown on each row.
enum NotificationKind {
  notice,
  bloodRequest,
  bookMessage,
  lostFound,
  classReminder,
  system;

  static NotificationKind fromApi(String? raw) => switch (raw) {
        'NOTICE' => NotificationKind.notice,
        'BLOOD_REQUEST' => NotificationKind.bloodRequest,
        'BOOK_MESSAGE' => NotificationKind.bookMessage,
        'LOST_FOUND' => NotificationKind.lostFound,
        'CLASS_REMINDER' => NotificationKind.classReminder,
        _ => NotificationKind.system,
      };

  IconData get icon => switch (this) {
        NotificationKind.notice => Icons.campaign_outlined,
        NotificationKind.bloodRequest => Icons.bloodtype_outlined,
        NotificationKind.bookMessage => Icons.chat_bubble_outline,
        NotificationKind.lostFound => Icons.inventory_2_outlined,
        NotificationKind.classReminder => Icons.schedule_outlined,
        NotificationKind.system => Icons.notifications_none,
      };
}

@immutable
class AppNotification {
  final String id;
  final NotificationKind kind;
  final String title;
  final String body;
  final DateTime createdAt;
  final DateTime? readAt;

  const AppNotification({
    required this.id,
    required this.kind,
    required this.title,
    required this.body,
    required this.createdAt,
    this.readAt,
  });

  bool get isRead => readAt != null;

  /// "Just now" / "5m ago" / "3d ago" / a date beyond a week.
  String get relativeTime {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'] as String,
        kind: NotificationKind.fromApi(json['type'] as String?),
        title: json['title'] as String,
        body: json['body'] as String? ?? '',
        createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
        readAt: json['readAt'] == null
            ? null
            : DateTime.parse(json['readAt'] as String).toLocal(),
      );

  AppNotification copyWith({DateTime? readAt}) => AppNotification(
        id: id,
        kind: kind,
        title: title,
        body: body,
        createdAt: createdAt,
        readAt: readAt ?? this.readAt,
      );
}
