// This is only the TransportationCard class.
// Your custom_cards.dart also contains DashboardCenteredCard, DashboardIconCard,
// NoticeBoardCard, DashboardSection, and DashboardRowCard — I don't have their
// source, so leave those untouched and just replace your existing
// TransportationCard class with this one.

import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class TransportationCard extends StatelessWidget {
  final VoidCallback onTap;
  final double scrollOffset;

  const TransportationCard({
    super.key,
    required this.onTap,
    this.scrollOffset = 0,
  });

  @override
  Widget build(BuildContext context) {
    // How far the image can pan left/right. Tune this to taste.
    const double maxPan = 40;
    final double dx = (-maxPan + (scrollOffset * 0.3)).clamp(-maxPan, 0.0);
    // starts at -maxPan (left part hidden/masked), moves toward 0 as user scrolls down

    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: SizedBox(
                height: 160,
                width: double.infinity,
                child: OverflowBox(
                  minWidth: 0,
                  maxWidth: double.infinity,
                  alignment: Alignment.centerLeft,
                  child: Transform.translate(
                    offset: Offset(dx, 0),
                    child: Image.asset(
                      'assets/images/bus_expanded.png',
                      fit: BoxFit.cover,
                      width: MediaQuery.of(context).size.width * 0.7, // wider than the card
                      height: 160,
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: Text('Transportation',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    decoration:
                    BoxDecoration(color: AppColors.mintChip, borderRadius: BorderRadius.circular(14)),
                    child: Row(
                      children: [
                        const Icon(Icons.search, size: 20, color: AppColors.darkGreen),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8.0),
                          child: Container(width: 1, height: 16, color: AppColors.subtitleGrey),
                        ),
                        const Text('Where to go',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.subtitleGrey)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
