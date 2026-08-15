import 'package:flutter/material.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/views/book_exchange/in_app_chat_page.dart';
import 'package:aust_track/views/book_exchange/seller_profile_page.dart';

class ListingDetailPage extends StatelessWidget {
  final Map<String, String> book;

  const ListingDetailPage({super.key, required this.book});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.darkGreen),
        title: Text(
          book['course'] ?? 'Listing',
          style: const TextStyle(color: AppColors.darkGreen, fontWeight: FontWeight.w800),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                height: 220,
                width: double.infinity,
                color: AppColors.mintChip,
                child: Image.asset(
                  book['image'] ?? '',
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const Icon(
                    Icons.menu_book_rounded,
                    color: AppColors.darkGreen,
                    size: 48,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              book['title'] ?? '',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              '${book['course'] ?? ''} • ${book['condition'] ?? ''}',
              style: const TextStyle(fontSize: 14, color: Colors.black54),
            ),
            const SizedBox(height: 8),
            Text(
              book['tag'] ?? '',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.darkGreen),
            ),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => SellerProfilePage(
                      sellerId: book['sellerId'] ?? '',
                      sellerName: book['seller'] ?? '',
                    ),
                  ),
                );
              },
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.mintChip,
                    backgroundImage: AssetImage('assets/images/seller_placeholder.png'),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    book['seller'] ?? '',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => InAppChatPage(
                      listingId: book['id'],
                      sellerId: book['sellerId'] ?? '',
                      sellerName: book['seller'] ?? '',
                      bookTitle: book['title'],
                      bookSubtitle: '${book['course'] ?? ''} • ${book['tag'] ?? ''}',
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.darkGreen,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
              ),
              child: const Text('Message Seller', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }
}
