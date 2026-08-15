import 'package:flutter/material.dart';
import 'package:aust_track/data/models/notice.dart';
import 'package:aust_track/theme/app_colors.dart';

class NoticeCard extends StatelessWidget {
  final Notice notice;
  final bool expanded;
  final VoidCallback onTap;

  const NoticeCard({
    super.key,
    required this.notice,
    required this.expanded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedSize(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOutCubic,
      alignment: Alignment.topCenter,
      child: notice.pinned
          ? _PinnedNoticeBody(
              notice: notice,
              expanded: expanded,
              onTap: onTap,
            )
          : _DefaultNoticeBody(
              notice: notice,
              expanded: expanded,
              onTap: onTap,
            ),
    );
  }
}

class _DefaultNoticeBody extends StatelessWidget {
  final Notice notice;
  final bool expanded;
  final VoidCallback onTap;

  const _DefaultNoticeBody({
    required this.notice,
    required this.expanded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final expanded = this.expanded;
    final body = expanded
        ? notice.body
        : notice.body.length > 110
            ? '${notice.body.substring(0, 110)}…'
            : notice.body;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _CategoryTag(notice: notice),
                    const Spacer(),
                    Text(
                      _formatDate(notice.postedAt),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.subtitleGrey,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  notice.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  body,
                  style: const TextStyle(
                    fontSize: 13.5,
                    color: AppColors.subtitleGrey,
                    height: 1.4,
                  ),
                ),
                if (!expanded && notice.body.length > 110) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: const [
                      Text(
                        'Read more',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.darkGreen,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(Icons.expand_more,
                          size: 18, color: AppColors.darkGreen),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PinnedNoticeBody extends StatelessWidget {
  final Notice notice;
  final bool expanded;
  final VoidCallback onTap;

  const _PinnedNoticeBody({
    required this.notice,
    required this.expanded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final body = expanded
        ? notice.body
        : notice.body.length > 160
            ? '${notice.body.substring(0, 160)}…'
            : notice.body;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(22),
        child: InkWell(
          borderRadius: BorderRadius.circular(22),
          onTap: onTap,
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              gradient: const LinearGradient(
                colors: [Color(0xFF2C8E6C), Color(0xFF339974)],
                begin: Alignment.bottomLeft,
                end: Alignment.topRight,
              ),
            ),
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.white.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.push_pin,
                              color: AppColors.white, size: 13),
                          SizedBox(width: 4),
                          Text(
                            'PINNED',
                            style: TextStyle(
                              color: AppColors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.6,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Text(
                      _formatDate(notice.postedAt),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.white.withValues(alpha: 0.85),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  notice.title,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.white,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  body,
                  style: TextStyle(
                    fontSize: 13.5,
                    color: AppColors.white.withValues(alpha: 0.92),
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CategoryTag extends StatelessWidget {
  final Notice notice;
  const _CategoryTag({required this.notice});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.mintChip,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(notice.category.icon, size: 13, color: AppColors.darkGreen),
          const SizedBox(width: 5),
          Text(
            notice.category.label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.darkGreen,
            ),
          ),
        ],
      ),
    );
  }
}

String _formatDate(DateTime d) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year}';
}
