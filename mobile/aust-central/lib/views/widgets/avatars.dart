import 'package:flutter/material.dart';

import 'package:aust_track/theme/app_colors.dart';

/// Avatar and cover placeholders that need no image files.
///
/// These replace four `AssetImage` paths that were referenced in code but had
/// no file on disk — `Image.asset` throws at runtime for a missing asset, so
/// every book card and seller row was one render away from an exception.
///
/// Drawing initials and icons instead of shipping placeholder binaries also
/// means a seller is visually distinguishable from the next one, which a shared
/// grey silhouette never achieved.

/// Circular avatar showing a person's initials.
class InitialsAvatar extends StatelessWidget {
  final String name;
  final double radius;

  const InitialsAvatar({super.key, required this.name, this.radius = 20});

  /// First letter of the first and last word, e.g. "Shahidul Islam Arman" → SA.
  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty);
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.mintChip,
      child: Text(
        _initials,
        style: TextStyle(
          // Scales with the circle so one widget serves 16px rows and 44px
          // profile headers alike.
          fontSize: radius * 0.7,
          fontWeight: FontWeight.bold,
          color: AppColors.darkGreen,
        ),
      ),
    );
  }
}

/// Stand-in for a book cover when a listing has no uploaded image.
class BookCoverPlaceholder extends StatelessWidget {
  final double? width;
  final double? height;
  final double radius;

  const BookCoverPlaceholder({
    super.key,
    this.width,
    this.height,
    this.radius = 12,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.mintSection,
        borderRadius: BorderRadius.circular(radius),
      ),
      alignment: Alignment.center,
      child: Icon(
        Icons.menu_book_outlined,
        size: (height ?? 64) * 0.4,
        color: AppColors.darkGreen,
      ),
    );
  }
}
