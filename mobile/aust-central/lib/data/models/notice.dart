import 'package:flutter/material.dart';

/// Notice board domain types.
///
/// These previously lived inside notice_card.dart, which forced the notice
/// board view model to import from views/ — inverting the dependency
/// direction MVVM depends on. Models belong to the data layer.

/// Hardcoded notice category labels used on the board filter chips.
enum NoticeCategory { academic, exam, event, general }

extension NoticeCategoryX on NoticeCategory {
  String get label {
    switch (this) {
      case NoticeCategory.academic:
        return 'Academic';
      case NoticeCategory.exam:
        return 'Exam';
      case NoticeCategory.event:
        return 'Event';
      case NoticeCategory.general:
        return 'General';
    }
  }

  IconData get icon {
    switch (this) {
      case NoticeCategory.academic:
        return Icons.menu_book_outlined;
      case NoticeCategory.exam:
        return Icons.fact_check_outlined;
      case NoticeCategory.event:
        return Icons.event_outlined;
      case NoticeCategory.general:
        return Icons.campaign_outlined;
    }
  }

  static NoticeCategory fromName(String? raw) {
    switch (raw) {
      case 'academic':
        return NoticeCategory.academic;
      case 'exam':
        return NoticeCategory.exam;
      case 'event':
        return NoticeCategory.event;
      case 'general':
      default:
        return NoticeCategory.general;
    }
  }
}

/// Plain notice value type. Kept lightweight — there is no remote source yet.
class Notice {
  final String id;
  final String title;
  final String body;
  final DateTime postedAt;
  final NoticeCategory category;
  final bool pinned;

  const Notice({
    required this.id,
    required this.title,
    required this.body,
    required this.postedAt,
    required this.category,
    this.pinned = false,
  });
}

/// One notice on the Notice Board. Renders two variants:
///
/// * **pinned** — full-bleed green gradient so it reads as "important" even at
///   glance, matching the existing `NoticeBoardCard` home tile.
/// * **default** — clean white card with a mint chip category tag, in the same
///   visual family as LostFoundScreen's item cards.
