import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/repositories/community_repository.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/viewmodels/lost_found_view_model.dart';
import 'package:aust_track/views/widgets/async_views.dart';

/// Lost & Found. Passive view over [LostFoundViewModel].
class LostFoundScreen extends StatelessWidget {
  const LostFoundScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => LostFoundViewModel(context.read<CommunityRepository>()),
      child: const _LostFoundView(),
    );
  }
}

class _LostFoundView extends StatefulWidget {
  const _LostFoundView();

  @override
  State<_LostFoundView> createState() => _LostFoundViewState();
}

class _LostFoundViewState extends State<_LostFoundView> {
  // The search controller is the view's own — it is text-field plumbing, not
  // application state. The submitted *value* goes to the view model.
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<LostFoundViewModel>();

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        foregroundColor: AppColors.textDark,
        title: const Text('Lost & Found'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 6),
            child: TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              onSubmitted: viewModel.setSearch,
              decoration: InputDecoration(
                hintText: 'Search items, colour, or room',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.arrow_forward),
                  onPressed: () => viewModel.setSearch(_searchController.text),
                ),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Lost vs Found: the two halves of the board, and a real data
          // distinction the original fixture list did not model at all.
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'FOUND', label: Text('Found')),
                ButtonSegment(value: 'LOST', label: Text('Lost')),
              ],
              selected: {viewModel.kind},
              onSelectionChanged: (s) => viewModel.setKind(s.first),
            ),
          ),

          SizedBox(
            height: 46,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              children: [
                for (final category in viewModel.categories)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(category),
                      selected: viewModel.selectedCategory == category,
                      onSelected: (_) => viewModel.setCategory(category),
                      selectedColor: AppColors.mintChip,
                      backgroundColor: Colors.white,
                      labelStyle: TextStyle(
                        color: viewModel.selectedCategory == category
                            ? AppColors.darkGreen
                            : AppColors.textDark,
                        fontWeight: viewModel.selectedCategory == category
                            ? FontWeight.w700
                            : FontWeight.w500,
                      ),
                    ),
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
                icon: Icons.inventory_2_outlined,
                message: 'Nothing matches your search',
              ),
              builder: () => ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                itemCount: viewModel.items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) => _ItemCard(
                  item: viewModel.items[index],
                  formattedDate: LostFoundViewModel.formatDate(
                    viewModel.items[index]['occurredOn'] as String,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final String formattedDate;

  const _ItemCard({required this.item, required this.formattedDate});

  @override
  Widget build(BuildContext context) {
    final colour = item['color'] as String? ?? '';
    final room = item['room'] as String? ?? '';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0x11000000)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.mintChip,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.inventory_2_outlined,
                color: AppColors.darkGreen, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['name'] as String,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  // Empty colour/room are omitted rather than rendered as the
                  // literal "N/A" the original fixtures carried.
                  [
                    if (colour.isNotEmpty) colour,
                    if (room.isNotEmpty) 'Room $room',
                    formattedDate,
                  ].join('  ·  '),
                  style: const TextStyle(
                      fontSize: 12.5, color: AppColors.subtitleGrey),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.mintSection,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              item['category'] as String,
              style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: AppColors.darkGreen,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
