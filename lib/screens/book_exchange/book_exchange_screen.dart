import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme/app_colors.dart';
// Same-directory imports (removing '../')
import 'book_notification_page.dart';
import 'book_post_page.dart';
import 'book_profile_page.dart';
import 'in_app_chat_page.dart';
import 'listing_detail_page.dart';
import 'seller_profile_page.dart';

class BookExchangeScreen extends StatefulWidget {
  const BookExchangeScreen({super.key});

  @override
  State<BookExchangeScreen> createState() => _BookExchangeScreenState();
}

class _BookExchangeScreenState extends State<BookExchangeScreen> {
  int selectedTab = 0; // 0: Browse, 1: My Listings, 2: Saved
  int selectedFilter = 1; // 0: Department, 1: Course Code, 2: Semester, 3: Free/Swap

  final Set<String> _bookmarkedIds = {};

  // Drop your picture at this path (e.g. assets/icons/profile_picture.png)
  // and register it in pubspec.yaml's assets list. If the file doesn't
  // exist (or you clear this to null), the default person icon is shown
  // instead — no crash, no manual toggling needed.
  String? _profileImagePath = 'assets/icons/profile_picture.png';

  final List<Map<String, String>> _books = [
    {
      'id': '1',
      'title': 'Organic Chemistry: Structure & Function',
      'course': 'CHEM 201',
      'department': 'Chemistry',
      'semester': 'Fall 2025',
      'condition': 'Like New',
      'tag': 'Swap / Free',
      'seller': 'Shahidul Islam Arman',
      'sellerId': 'seller_001',
      'rating': '4.9',
      'image': 'assets/images/book_placeholder.png',
    },
    {
      'id': '2',
      'title': 'Organic Chemistry: Structure & Function',
      'course': 'CHEM 201',
      'department': 'Chemistry',
      'semester': 'Spring 2025',
      'condition': 'Like New',
      'tag': '300 BDT',
      'seller': 'Shahidul Islam Arman',
      'sellerId': 'seller_001',
      'rating': '4.9',
      'image': 'assets/images/book_placeholder.png',
    },
  ];

  List<Map<String, String>> get visibleBooks {
    List<Map<String, String>> list;
    if (selectedTab == 2) {
      // Saved tab
      list = _books.where((b) => _bookmarkedIds.contains(b['id'])).toList();
    } else {
      list = List<Map<String, String>>.from(_books);
    }

    switch (selectedFilter) {
      case 0: // Department
        list.sort((a, b) => a['department']!.compareTo(b['department']!));
        break;
      case 1: // Course Code
        list.sort((a, b) => a['course']!.compareTo(b['course']!));
        break;
      case 2: // Semester
        list.sort((a, b) => a['semester']!.compareTo(b['semester']!));
        break;
      case 3: // Free/Swap first
        list.sort((a, b) {
          final aFree = a['tag']!.toLowerCase().contains('swap') ||
              a['tag']!.toLowerCase().contains('free');
          final bFree = b['tag']!.toLowerCase().contains('swap') ||
              b['tag']!.toLowerCase().contains('free');
          if (aFree == bFree) return 0;
          return aFree ? -1 : 1;
        });
        break;
    }

    return list;
  }

  void _toggleBookmark(String id) {
    setState(() {
      if (_bookmarkedIds.contains(id)) {
        _bookmarkedIds.remove(id);
      } else {
        _bookmarkedIds.add(id);
      }
    });
  }

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
    final books = visibleBooks;
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
  Widget _buildProfileAvatar() {
    return CircleAvatar(
      radius: 20,
      backgroundColor: AppColors.mintChip,
      backgroundImage:
      _profileImagePath != null ? AssetImage(_profileImagePath!) : null,
      onBackgroundImageError: _profileImagePath != null
          ? (_, __) {
        // Asset missing/failed to load — fall back to the icon.
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) setState(() => _profileImagePath = null);
        });
      }
          : null,
      child: _profileImagePath == null
          ? const Icon(
        Icons.person_rounded,
        color: AppColors.darkGreen,
        size: 22,
      )
          : null,
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
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const BookPostPage(),
                          ),
                        );
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
          final bool selected = selectedTab == index;
          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: GestureDetector(
              onTap: () => setState(() => selectedTab = index),
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
          final bool selected = selectedFilter == index;
          return GestureDetector(
            onTap: () => setState(() => selectedFilter = index),
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
    final bool bookmarked = _bookmarkedIds.contains(book['id']);
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
                  child: Container(
                    width: 64,
                    height: 84,
                    color: AppColors.mintChip,
                    child: Image.asset(
                      book['image']!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Icon(
                        Icons.menu_book_rounded,
                        color: AppColors.darkGreen.withValues(alpha: 0.5),
                      ),
                    ),
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
                            onTap: () => _toggleBookmark(book['id']!),
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
                  child: const CircleAvatar(
                    radius: 16,
                    backgroundColor: AppColors.mintChip,
                    backgroundImage: AssetImage('assets/images/seller_placeholder.png'),
                  ),
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