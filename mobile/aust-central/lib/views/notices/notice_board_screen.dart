import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/repositories/community_repository.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/viewmodels/notice_board_view_model.dart';
import 'package:aust_track/views/widgets/async_views.dart';
import 'package:aust_track/data/models/notice.dart';
import 'package:aust_track/views/widgets/notice_card.dart';

/// Notice board. Passive view over [NoticeBoardViewModel].
///
/// Students read; only MODERATOR/ADMIN can post, and that is enforced by the
/// server rather than by hiding buttons here.
class NoticeBoardScreen extends StatelessWidget {
  const NoticeBoardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => NoticeBoardViewModel(context.read<CommunityRepository>()),
      child: const _NoticeBoardView(),
    );
  }
}

class _NoticeBoardView extends StatelessWidget {
  const _NoticeBoardView();

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<NoticeBoardViewModel>();

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        foregroundColor: AppColors.textDark,
        title: const Text('Notice Board'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: TextField(
              textInputAction: TextInputAction.search,
              onSubmitted: viewModel.setSearch,
              decoration: InputDecoration(
                hintText: 'Search notices',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              children: [
                _CategoryChip(
                  label: 'All',
                  selected: viewModel.category == null,
                  onTap: () => viewModel.setCategory(null),
                ),
                for (final category in NoticeCategory.values)
                  _CategoryChip(
                    label: category.label,
                    selected: viewModel.category == category,
                    onTap: () => viewModel.setCategory(category),
                  ),
              ],
            ),
          ),
          Expanded(
            child: AsyncContent(
              loading: viewModel.isBusy,
              error: viewModel.errorMessage,
              isEmpty: viewModel.isEmpty,
              onRetry: () => viewModel.load(silent: true),
              emptyView: const EmptyView(
                icon: Icons.campaign_outlined,
                message: 'No notices to show',
              ),
              builder: () => ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                itemCount: viewModel.notices.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final notice = viewModel.notices[index];
                  return NoticeCard(
                    notice: notice,
                    expanded: viewModel.isExpanded(notice.id),
                    onTap: () => viewModel.toggleExpanded(notice.id),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.mintChip,
        backgroundColor: Colors.white,
        labelStyle: TextStyle(
          color: selected ? AppColors.darkGreen : AppColors.textDark,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
    );
  }
}
