import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/repositories/community_repository.dart';
import 'package:aust_track/viewmodels/seller_profile_view_model.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/views/widgets/async_views.dart';
import 'package:aust_track/views/book_exchange/in_app_chat_page.dart';

/// A seller's public profile: their rating, reviews, and active listings.
///
/// The rating was a hardcoded `4.9` for every seller and the history was a
/// permanent "No past exchanges yet". Both are now real, and the rating is
/// absent rather than invented when nobody has reviewed them.
class SellerProfilePage extends StatelessWidget {
  final String sellerId;
  final String sellerName;

  const SellerProfilePage({
    super.key,
    required this.sellerId,
    required this.sellerName,
  });

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SellerProfileViewModel(
        context.read<CommunityRepository>(),
        sellerId: sellerId,
      ),
      child: _SellerProfileView(sellerName: sellerName, sellerId: sellerId),
    );
  }
}

class _SellerProfileView extends StatelessWidget {
  final String sellerName;
  final String sellerId;

  const _SellerProfileView({required this.sellerName, required this.sellerId});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<SellerProfileViewModel>();
    final rating = viewModel.averageRating;

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.darkGreen),
        title: Text(
          sellerName,
          style: const TextStyle(
              color: AppColors.darkGreen, fontWeight: FontWeight.w800),
        ),
      ),
      body: SafeArea(
        child: viewModel.isBusy
            ? const LoadingView()
            : viewModel.hasError
                ? ErrorView(
                    message: viewModel.errorMessage!,
                    onRetry: () => viewModel.load(silent: true),
                  )
                : RefreshIndicator(
                    onRefresh: () => viewModel.load(silent: true),
                    color: AppColors.darkGreen,
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        Center(
                          child: CircleAvatar(
                            radius: 44,
                            backgroundColor: AppColors.mintChip,
                            child: Text(
                              sellerName.characters.first.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: AppColors.darkGreen,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Center(
                          child: Text(
                            sellerName,
                            style: const TextStyle(
                                fontSize: 18, fontWeight: FontWeight.w800),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Center(
                          child: rating == null
                              // Honest absence beats a fabricated score.
                              ? const Text('No reviews yet',
                                  style: TextStyle(color: Colors.black54))
                              : Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.star_rounded,
                                        size: 16, color: AppColors.warning),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${rating.toStringAsFixed(1)} '
                                      '(${viewModel.reviewCount} review${viewModel.reviewCount == 1 ? '' : 's'})',
                                      style: const TextStyle(color: Colors.black54),
                                    ),
                                  ],
                                ),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: !viewModel.canMessage
                              ? null
                              : () {
                                  // A conversation is keyed to a listing, so
                                  // messaging opens against their newest one.
                                  
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => InAppChatPage(
                                        listingId: viewModel.messageableListingId!,
                                        sellerId: sellerId,
                                        sellerName: sellerName,
                                        bookTitle: viewModel.messageableListingTitle,
                                      ),
                                    ),
                                  );
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.darkGreen,
                            foregroundColor: Colors.white,
                            minimumSize: const Size.fromHeight(48),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(28)),
                          ),
                          child: Text(
                            !viewModel.canMessage
                                ? 'No active listings'
                                : 'Message',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                        const SizedBox(height: 28),
                        const Text('Active Listings',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 12),
                        if (!viewModel.canMessage)
                          const _EmptyBox(text: 'Nothing listed right now')
                        else
                          for (final listing in viewModel.listings)
                            _InfoTile(
                              title: listing['title'] as String,
                              subtitle:
                                  '${listing['courseCode']} · ${listing['semester']}',
                            ),
                        const SizedBox(height: 28),
                        const Text('Reviews',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 12),
                        if (viewModel.reviews.isEmpty)
                          const _EmptyBox(text: 'No reviews yet')
                        else
                          for (final review in viewModel.reviews)
                            _InfoTile(
                              title:
                                  '${'★' * (review['rating'] as int)}  ${review['raterName']}',
                              subtitle: (review['comment'] as String).isEmpty
                                  ? 'No comment left'
                                  : review['comment'] as String,
                            ),
                      ],
                    ),
                  ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String title;
  final String subtitle;

  const _InfoTile({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.mintSection),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontWeight: FontWeight.w700, color: AppColors.textDark)),
          const SizedBox(height: 4),
          Text(subtitle,
              style: const TextStyle(
                  fontSize: 12.5, color: AppColors.subtitleGrey)),
        ],
      ),
    );
  }
}

class _EmptyBox extends StatelessWidget {
  final String text;
  const _EmptyBox({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.mintSection),
      ),
      child: Text(text, style: const TextStyle(color: Colors.black45)),
    );
  }
}
