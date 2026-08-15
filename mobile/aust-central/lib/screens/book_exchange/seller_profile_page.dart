import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import 'in_app_chat_page.dart';

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
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.darkGreen),
        title: Text(
          sellerName,
          style: const TextStyle(color: AppColors.darkGreen, fontWeight: FontWeight.w800),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Center(
              child: CircleAvatar(
                radius: 44,
                backgroundColor: AppColors.mintChip,
                backgroundImage: AssetImage('assets/images/seller_placeholder.png'),
              ),
            ),
            const SizedBox(height: 14),
            Center(
              child: Text(
                sellerName,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
            ),
            const SizedBox(height: 4),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.star_rounded, size: 16, color: AppColors.warning),
                  SizedBox(width: 4),
                  Text('4.9', style: TextStyle(color: Colors.black54)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => InAppChatPage(sellerId: sellerId, sellerName: sellerName),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.darkGreen,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
              ),
              child: const Text('Message', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
            const SizedBox(height: 28),
            const Text(
              'Exchange History',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            // TODO: replace with real history pulled by sellerId
            const _EmptyHistory(),
          ],
        ),
      ),
    );
  }
}

class _EmptyHistory extends StatelessWidget {
  const _EmptyHistory();

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
      child: const Text(
        'No past exchanges yet',
        style: TextStyle(color: Colors.black45),
      ),
    );
  }
}
