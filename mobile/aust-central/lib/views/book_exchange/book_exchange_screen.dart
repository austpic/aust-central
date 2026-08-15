import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:provider/provider.dart';

import 'package:aust_track/data/repositories/community_repository.dart';
import 'package:aust_track/viewmodels/book_exchange_view_model.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/views/widgets/avatars.dart';
import 'package:aust_track/views/widgets/async_views.dart';
// Same-directory imports (removing '../')
import 'package:aust_track/views/book_exchange/book_notification_page.dart';
import 'package:aust_track/views/book_exchange/book_post_page.dart';
import 'package:aust_track/views/book_exchange/book_profile_page.dart';
import 'package:aust_track/views/book_exchange/in_app_chat_page.dart';
import 'package:aust_track/views/book_exchange/listing_detail_page.dart';
import 'package:aust_track/views/book_exchange/seller_profile_page.dart';

class BookExchangeScreen extends StatelessWidget {
  const BookExchangeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => BookExchangeViewModel(context.read<CommunityRepository>()),
      child: const _BookExchangeView(),
    );
  }
}

class _BookExchangeView extends StatefulWidget {
  const _BookExchangeView();

  @override
  State<_BookExchangeView> createState() => _BookExchangeScreenState();
}

class _BookExchangeScreenState extends State<_BookExchangeView> {


  Future<void> copyListingLink(Map<String, String> book) async {
    final link = 'https://yourapp.com/listing/${book['id']}';
    await Clipboard.setData(ClipboardData(text: link));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Link copied to clipboard')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<BookExchangeViewModel>();
    final books = viewModel.books;
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  buildTopBar(context),
                  const SizedBox(height: 16),
                  buildHeroBanner(context),
                  const SizedBox(height: 20),
                  buildTabRow(),
                  const SizedBox(height: 16),
                  buildSearchBar(),
                  const SizedBox(height: 14),
                  _buildFilterChips(),
                  const SizedBox(height: 16),
                ],
              ),
            ),
            if (viewModel.isBusy)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 60),
                  child: LoadingView(),
                ),
              )
            else if (viewModel.hasError)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: ErrorView(
                    message: viewModel.errorMessage!,
                    onRetry: () => viewModel.load(silent: true),
                  ),
                ),
              )
            else if (books.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: EmptyView(
                    icon: Icons.menu_book_outlined,
                    message: viewModel.emptyMessage,
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final book = books[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: buildBookCard(context, book),
                      );
                    },
                    childCount: books.length,
                  ),
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }

  Widget buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () => Navigator.of(context).maybePop(),
                child: const Icon(
                  Icons.arrow_back_rounded,
                  color: AppColors.darkGreen,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Book Exchange',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppColors.darkGreen,
                ),
              ),
            ],
          ),
          Row(
            children: [
              _circleIconButton(
                icon: Icons.notifications_none_rounded,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const BookNotificationPage(),
                    ),
                  );
                },
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const BookProfilePage(),
                    ),
                  );
                },
                child: _buildProfileAvatar(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Shows the user's profile picture if one is set at [_profileImagePath].
  /// If it's null, or the asset fails to load (e.g. no file placed yet),
  /// it automatically falls back to a plain profile icon.
  /// Top-bar avatar.
  ///
  /// No profile image asset ships with the app, and the path this used to
  /// reference did not exist on disk. Renders a plain icon until avatars are
  /// wired to uploaded FileObject ids.
  Widget _buildProfileAvatar() {
    return const CircleAvatar(
      radius: 20,
      backgroundColor: AppColors.mintChip,
      child: Icon(Icons.person_rounded, color: AppColors.darkGreen, size: 22),
    );
  }

  Widget _circleIconButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: const BoxDecoration(
          color: AppColors.mintChip,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppColors.darkGreen, size: 20),
      ),
    );
  }

  Widget buildHeroBanner(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          height: 170,
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.darkGreen,
                Color.lerp(AppColors.darkGreen, Colors.black, 0.25)!,
              ],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -30,
                top: -30,
                child: Container(
                  width: 150,
                  height: 150,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.06),
                  ),
                ),
              ),
              Positioned(
                right: 20,
                bottom: -40,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(22, 22, 22, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Give Your Old\nTextbooks New Life',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 21,
                        fontWeight: FontWeight.w800,
                        height: 1.25,
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        // Reload when the post page reports a successful
                        // create, so the new listing is visible immediately.
                        Navigator.push<bool>(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const BookPostPage(),
                          ),
                        ).then((created) {
                          if (created == true) {
                            if (!context.mounted) return;
                            context.read<BookExchangeViewModel>().load(silent: true);
                          }
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.darkGreen,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 22,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Text(
                        'Post a Book',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildTabRow() {
    final tabs = ['Browse', 'My Listings', 'Saved'];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: List.generate(tabs.length, (index) {
          final bool selected = context.read<BookExchangeViewModel>().selectedTab == index;
          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: GestureDetector(
              onTap: () => context.read<BookExchangeViewModel>().selectTab(index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: selected ? AppColors.darkGreen : AppColors.mintChip,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Text(
                  tabs[index],
                  style: TextStyle(
                    color: selected ? Colors.white : AppColors.textDark,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.mintSection),
        ),
        child: Row(
          children: [
            Icon(
              Icons.search_rounded,
              color: AppColors.darkGreen.withValues(alpha: 0.6),
              size: 22,
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search by title, author, course...',
                  hintStyle: TextStyle(color: Colors.black38, fontSize: 14),
                  border: InputBorder.none,
                  isDense: true,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChips() {
    final filters = ['Department', 'Course Code', 'Semester', 'Free/Swap'];
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final bool selected = context.read<BookExchangeViewModel>().selectedFilter == index;
          return GestureDetector(
            onTap: () => context.read<BookExchangeViewModel>().selectFilter(index),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? AppColors.darkGreen : AppColors.mintChip,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                filters[index],
                style: TextStyle(
                  color: selected ? Colors.white : AppColors.textDark,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget buildBookCard(BuildContext context, Map<String, String> book) {
    final bool bookmarked = context.watch<BookExchangeViewModel>().isBookmarked(book['id']!);
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ListingDetailPage(book: book),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.mintSection),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: const BookCoverPlaceholder(
                    width: 64,
                    height: 84,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          _tinyChip(book['course']!),
                          const SizedBox(width: 6),
                          _tinyChip(book['condition']!, filled: false),
                          const Spacer(),
                          _actionIcon(
                            icon: Icons.ios_share_rounded,
                            onTap: () => copyListingLink(book),
                          ),
                          const SizedBox(width: 8),
                          _actionIcon(
                            icon: bookmarked
                                ? Icons.bookmark_rounded
                                : Icons.bookmark_border_rounded,
                            onTap: () => context.read<BookExchangeViewModel>().toggleBookmark(book['id']!),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        book['title']!,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Color(0xff1C1C1C),
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        book['tag']!,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.darkGreen.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1, color: AppColors.mintSection),
            const SizedBox(height: 12),
            Row(
              children: [
                GestureDetector(
                  onTap: () => _openSellerProfile(context, book),
                  child: InitialsAvatar(name: book['seller'] ?? '', radius: 16),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _openSellerProfile(context, book),
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          book['seller']!,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(
                              Icons.star_rounded,
                              size: 14,
                              color: AppColors.warning,
                            ),
                            const SizedBox(width: 2),
                            Text(
                              book['rating']!,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => InAppChatPage(
                          listingId: book['id'],
                          sellerId: book['sellerId']!,
                          sellerName: book['seller']!,
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.darkGreen,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 10,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                  child: const Text(
                    'Message',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _openSellerProfile(BuildContext context, Map<String, String> book) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SellerProfilePage(
          sellerId: book['sellerId']!,
          sellerName: book['seller']!,
        ),
      ),
    );
  }

  Widget _tinyChip(String label, {bool filled = true}) {
    return Container(
      height: 32,
      alignment: Alignment.center,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: filled ? AppColors.mintChip : const Color(0xffF1F1F1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: filled ? AppColors.textDark : Colors.black54,
        ),
      ),
    );
  }

  Widget _actionIcon({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        alignment: Alignment.center,
        decoration: const BoxDecoration(
          color: AppColors.mintChip,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 20, color: AppColors.darkGreen),
      ),
    );
  }
}
