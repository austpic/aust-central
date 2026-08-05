import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color scaffoldBackground = Color(0xFFE9EDEA);
  static const Color darkGreen = Color(0xFF1B4332);
  static const Color textDark = Color(0xFF1B4332);
  static const Color mintChip = Color(0xFFC2DED0);
  static const Color mintSection = Color(0xFFC9E1D5);
  static const Color white = Color(0xFFFFFFFF);
  static const Color subtitleGrey = Color(0xFF6B8578);

  // Semantic state tokens (added for Blood Bank urgency + eligibility states).
  // Kept restrained: surfaced only in pills, badges, and progress fills —
  // never as full-bleed page backgrounds.
  static const Color success = Color(0xFF2F8F6A);
  static const Color warning = Color(0xFFD89030);
  static const Color danger = Color(0xFFB5392B);

  // Avatar / icon swatch on request cards (matches BloodBank dashboard icon tone).
  static const Color bloodRedSoft = Color(0xFFE9A8A8);
}