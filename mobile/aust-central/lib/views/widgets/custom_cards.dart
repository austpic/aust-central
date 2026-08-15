import 'package:flutter/material.dart';
import 'package:aust_track/theme/app_colors.dart';

// ---------------------------------------------------------------------
// 1. Centered Card (For To-Do List & Class Reminder)
// ---------------------------------------------------------------------
class DashboardCenteredCard extends StatelessWidget {
  final String title;
  final String? chipText;
  final VoidCallback onTap;

  const DashboardCenteredCard({
    super.key,
    required this.title,
    this.chipText,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              Text(title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                      height: 1.15)),
              const Spacer(),
              // Hidden entirely when there is no figure to show. An empty pill
              // reads as "zero", which is a different claim from "not loaded".
              if (chipText != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                    color: AppColors.mintChip,
                    borderRadius: BorderRadius.circular(14)),
                alignment: Alignment.center,
                child: Text(chipText!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textDark)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------
// 2. Icon + 2-Line Text Card (For CGPA, Lab Report, Blood Bank, etc.)
// ---------------------------------------------------------------------
class DashboardIconCard extends StatelessWidget {
  final String title;
  final String? chipText;
  final VoidCallback onTap;
  final Widget leadingIcon;

  const DashboardIconCard({
    super.key,
    required this.title,
    this.chipText,
    required this.onTap,
    required this.leadingIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  leadingIcon,
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(title,
                        maxLines: 2,
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                            height: 1.15)),
                  ),
                ],
              ),
              const Spacer(),
              const SizedBox(height: 10),
              if (chipText != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 6), // Increased height
                decoration: BoxDecoration(
                    color: AppColors.mintChip,
                    borderRadius: BorderRadius.circular(14)),
                alignment: Alignment.center,
                child: Text(chipText!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textDark)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------
// 3. Row Card (For User Profile)
// ---------------------------------------------------------------------
class DashboardRowCard extends StatelessWidget {
  final String title;
  final String? trailingText;
  final Widget leadingWidget; // Changed to accept SVG or Icon
  final VoidCallback onTap;

  const DashboardRowCard({
    super.key,
    required this.title,
    this.trailingText,
    required this.leadingWidget,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              leadingWidget,
              const SizedBox(width: 12),
              Expanded(
                child: Text(title,
                    style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark
                    )
                ),
              ),
              const SizedBox(width: 8),
              if (trailingText != null)
              Container(
                padding: const EdgeInsets.symmetric(vertical:9, horizontal: 10),
                decoration:
                BoxDecoration(
                    color: AppColors.mintChip,
                    borderRadius: BorderRadius.circular(18)),
                child: Text(trailingText!,
                    style: const
                    TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textDark
                    )
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------
// 4. Notice Board Card (Gradient Background)
// ---------------------------------------------------------------------
class NoticeBoardCard extends StatelessWidget {
  final String title;
  final String message;
  final VoidCallback onTap;

  const NoticeBoardCard({super.key, required this.title, required this.message, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Ink(
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: const LinearGradient(
              colors: [AppColors.noticeGradientStart, AppColors.noticeGradientEnd], // 45-degree gradient
              begin: Alignment.bottomLeft,
              end: Alignment.topRight,
            ),
          ),
          padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
          child: Column(
            children: [
              Text(title,
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text(message,
                  textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 14)),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------
// Dashboard Section Wrapper
// ---------------------------------------------------------------------
class DashboardSection extends StatelessWidget {
  final String label;
  final List<Widget> children;

  const DashboardSection({super.key, required this.label, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.mintSection, borderRadius: BorderRadius.circular(26)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 12),
            child: Text(label,
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark)),
          ),
          ...children,
        ],
      ),
    );
  }
}