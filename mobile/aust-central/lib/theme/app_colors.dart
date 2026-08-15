import 'package:flutter/material.dart';

/// All app colour tokens.
///
/// Two palettes live here, and that is a real inconsistency in the design
/// rather than an accident of the code:
///
///   * [AppColors] — the dark-green brand (`#1B4332`). Dashboard, blood bank,
///     notices, lost & found, book exchange.
///   * [CgpaColors] — a lighter green (`#407362`) on a near-white background.
///     CGPA, class reminder, to-do, lab report.
///
/// They were previously in two files, plus a third private palette declared
/// inside todo_list_screen.dart and a set of raw hex literals in
/// lab_report_screen.dart. Those are now folded in here with **every value
/// preserved**, so nothing changed visually.
///
/// Collapsing the two palettes into one is a *design* decision — it would
/// visibly restyle roughly half the screens — so it is deliberately not done
/// here. This file just makes the divergence visible in one place instead of
/// scattered across four.

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

/// The lighter-green palette used by the academic screens.
class CgpaColors {
  CgpaColors._();

  static const Color primary = Color(0xFF407362);
  static const Color secondary = Color(0xFF579D83);
  static const Color lightAccent = Color(0xFFBEEDDC);
  static const Color background = Color(0xFFF1F2F2);
  static const Color border = Color(0xFFB5B5B5);
  static const Color white = Color(0xFFFFFFFF);
  static const Color textDark = Color(0xFF1B1B1B);
  static const Color textMedium = Color(0xFF4A4A4A);
  static const Color textLight = Color(0xFF7A7A7A);
  static const Color cardShadow = Color(0x1A000000);
  static const Color success = Color(0xFF2E7D5B);
  static const Color warning = Color(0xFFE8A838);
  static const Color error = Color(0xFFD64545);

  // --- Folded in from the private palette in todo_list_screen.dart ---------
  // These three had no equivalent above; the rest of that palette mapped onto
  // existing tokens with identical values.

  /// Softer heading green used on the to-do list. Distinct from [textDark],
  /// which is near-black.
  static const Color headingDark = Color(0xFF2C3E35);

  /// Pairs with [primary] for the to-do progress header gradient.
  static const Color gradientLight = Color(0xFF8CD4B8);

  /// Neutral grey subtitle, warmer than [textLight].
  static const Color subtitleGrey = Color(0xFF616161);

  /// Page background on the lab report form.
  static const Color formBackground = Color(0xFFF4F7F6);

  /// Input fill on the lab report form.
  static const Color inputFill = Color(0xFFF9FBFB);
}
