import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../widgets/notice_card.dart';

/// Notice Board — central feed of academic / exam / event / general
/// announcements. Hardcoded for now; behind a single model class so a future
/// remote feed is a swap of [_seedNotices].
class NoticeBoardScreen extends StatefulWidget {
  const NoticeBoardScreen({super.key});

  @override
  State<NoticeBoardScreen> createState() => _NoticeBoardScreenState();
}

class _NoticeBoardScreenState extends State<NoticeBoardScreen> {
  String _search = '';
  NoticeCategory? _filter; // null = All
  final Set<String> _expanded = {};

  static final List<Notice> _seedNotices = [
    Notice(
      id: 'n1',
      title: 'Mandatory attendance for CSE-301 lab tomorrow',
      body:
          'All Section B students enrolled in CSE-301 (Data Structures) must '
          'attend tomorrow\'s lab session. Roll will be taken at 8:30 am '
          'sharp. Students without prior written exemption will be marked '
          'absent.',
      postedAt: DateTime(2026, 4, 14),
      category: NoticeCategory.academic,
      pinned: true,
    ),
    Notice(
      id: 'n2',
      title: 'Mid-term routine released for Section B',
      body:
          'The Spring 2026 mid-term routine for Section B has been published. '
          'Pick up a copy from your department office or check the notice '
          'board outside Room 4C02. Re-checkouts start Monday.',
      postedAt: DateTime(2026, 4, 11),
      category: NoticeCategory.exam,
    ),
    Notice(
      id: 'n3',
      title: 'Career Fair 2026 — registrations open',
      body:
          'AUST Central Career Fair returns on 24 May. 40+ companies '
          'including GP, BRAC, and Pathao will be on campus. Register by 18 '
          'May at the career services desk — bring your CV.',
      postedAt: DateTime(2026, 4, 9),
      category: NoticeCategory.event,
    ),
    Notice(
      id: 'n4',
      title: 'Library closed Friday for maintenance',
      body:
          'The main library will be closed this Friday from 9 am to 6 pm for '
          'AC maintenance. Reading rooms on the third floor will remain open.',
      postedAt: DateTime(2026, 4, 7),
      category: NoticeCategory.general,
    ),
    Notice(
      id: 'n5',
      title: 'Bus schedule updated for Route 3',
      body:
          'Route 3 (Mirpur–Campus) now leaves the Mirpur pick-up point 15 '
          'minutes earlier on weekdays to avoid the morning rush. See the '
          'updated PDF on the Transport page.',
      postedAt: DateTime(2026, 4, 5),
      category: NoticeCategory.general,
    ),
    Notice(
      id: 'n6',
      title: 'Scholarship application deadline: 30 April',
      body:
          'Final-year students applying for the Vice-Chancellor\'s Merit '
          'Scholarship must submit their completed forms to the registrar by '
          '5 pm on 30 April. Late submissions will not be considered.',
      postedAt: DateTime(2026, 4, 3),
      category: NoticeCategory.academic,
    ),
    Notice(
      id: 'n7',
      title: 'Hackathon "AUST Codestorm 2026" registrations open',
      body:
          'Three-day campus hackathon hosted by the CSE department. Form '
          'teams of 3–4 by 20 April. Top 3 teams go to the national round.',
      postedAt: DateTime(2026, 4, 1),
      category: NoticeCategory.event,
    ),
    Notice(
      id: 'n8',
      title: 'Campus Wi-Fi maintenance Sunday 2–4 am',
      body:
          'Campus-wide Wi-Fi will be intermittent on Sunday between 2 am and '
          '4 am while the gateway is replaced. Wired connections in the labs '
          'will be unaffected.',
      postedAt: DateTime(2026, 3, 30),
      category: NoticeCategory.general,
    ),
  ];

  List<Notice> get _visible {
    final query = _search.trim().toLowerCase();
    return _seedNotices.where((n) {
      final matchesCat = _filter == null || n.category == _filter;
      final matchesSearch = query.isEmpty ||
          n.title.toLowerCase().contains(query) ||
          n.body.toLowerCase().contains(query);
      return matchesCat && matchesSearch;
    }).toList()
      ..sort((a, b) {
        // pinned first, then most recent.
        if (a.pinned != b.pinned) return a.pinned ? -1 : 1;
        return b.postedAt.compareTo(a.postedAt);
      });
  }

  @override
  Widget build(BuildContext context) {
    final visible = _visible;
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textDark),
        title: const Text(
          'Notice Board',
          style: TextStyle(
            color: AppColors.darkGreen,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: 'Search notices…',
                hintStyle: const TextStyle(color: AppColors.subtitleGrey),
                prefixIcon:
                    const Icon(Icons.search, color: AppColors.subtitleGrey),
                filled: true,
                fillColor: AppColors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(15),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _CategoryChip(
                  label: 'All',
                  selected: _filter == null,
                  onTap: () => setState(() => _filter = null),
                ),
                for (final c in NoticeCategory.values)
                  _CategoryChip(
                    label: c.label,
                    icon: c.icon,
                    selected: _filter == c,
                    onTap: () => setState(() => _filter = c),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: visible.isEmpty
                ? const _EmptyState()
                : ListView(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 6),
                    children: [
                      for (final n in visible)
                        NoticeCard(
                          key: ValueKey(n.id),
                          notice: n,
                          expanded: _expanded.contains(n.id),
                          onTap: () => setState(() {
                            if (!_expanded.add(n.id)) _expanded.remove(n.id);
                          }),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: ChoiceChip(
        avatar: icon == null
            ? null
            : Icon(icon,
                size: 14,
                color: selected ? AppColors.white : AppColors.darkGreen),
        label: Text(label),
        selected: selected,
        selectedColor: AppColors.darkGreen,
        backgroundColor: AppColors.mintChip,
        labelStyle: TextStyle(
          color: selected ? AppColors.white : AppColors.textDark,
          fontWeight: selected ? FontWeight.bold : FontWeight.w500,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.mintChip,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.search_off,
                color: AppColors.darkGreen,
                size: 28,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No notices match your search.',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Try a different keyword or clear the category filter.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.subtitleGrey,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
