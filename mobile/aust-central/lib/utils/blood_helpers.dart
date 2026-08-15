/// Local date helpers for the donor form.
///
/// NOT the source of truth for eligibility — the server evaluates the
/// 90-day rule and returns the verdict on DonorProfile. What remains here is
/// the date-picker clamp and display formatting, which are client concerns.
class BloodEligibility {
  BloodEligibility._();

  /// Standard whole-blood donation interval — set by the AUST campus blood
  /// donation guidelines (WHO-aligned, 90 days for males and females).
  static const int donationIntervalDays = 90;

  /// Calendar days between [lastDonated] (local date at start of day) and today.
  static int daysSince(DateTime lastDonated, [DateTime? now]) {
    final n = now ?? DateTime.now();
    final last = DateTime(lastDonated.year, lastDonated.month, lastDonated.day);
    final today = DateTime(n.year, n.month, n.day);
    return today.difference(last).inDays;
  }

  /// Days remaining until the donor can donate again. Returns 0 when eligible
  /// now or in the past (i.e. last donated more than 90 days ago).
  static int daysUntilEligible(DateTime lastDonated, [DateTime? now]) {
    final remaining =
        donationIntervalDays - daysSince(lastDonated, now);
    return remaining < 0 ? 0 : remaining;
  }

  static bool isEligible(DateTime lastDonated, [DateTime? now]) =>
      daysUntilEligible(lastDonated, now) == 0;

  /// 0.0 to 1.0 — how far we are through the waiting window. 0 = just donated,
  /// 1.0 = eligible.
  static double progress(DateTime lastDonated, [DateTime? now]) {
    final since = daysSince(lastDonated, now);
    if (since <= 0) return 0;
    if (since >= donationIntervalDays) return 1;
    return since / donationIntervalDays;
  }

  /// User-facing copy used by the My Status card and dashboard.
  static String statusCopy(DateTime? lastDonated, [DateTime? now]) {
    if (lastDonated == null) {
      return 'No donation recorded yet';
    }
    if (isEligible(lastDonated, now)) {
      return 'Eligible to donate now';
    }
    final left = daysUntilEligible(lastDonated, now);
    return '$left day${left == 1 ? '' : 's'} until eligible';
  }

  /// Pretty "X days ago" copy for the status card subtitle.
  static String sinceCopy(DateTime? lastDonated, [DateTime? now]) {
    if (lastDonated == null) return 'No prior donation';
    final d = daysSince(lastDonated, now);
    if (d == 0) return 'Donated today';
    if (d == 1) return 'Donated yesterday';
    if (d < 30) return 'Donated $d days ago';
    if (d < 60) return 'Donated about 1 month ago';
    if (d < 90) return 'Donated about 2 months ago';
    if (d < 365) {
      final months = (d / 30).round();
      return 'Donated about $months months ago';
    }
    final years = (d / 365).round();
    return 'Donated about $years year${years == 1 ? '' : 's'} ago';
  }

  /// Convenience for date pickers — clamps future picks.
  static DateTime clampToPastOrToday(DateTime picked, [DateTime? now]) {
    final n = now ?? DateTime.now();
    final today = DateTime(n.year, n.month, n.day);
    final day = DateTime(picked.year, picked.month, picked.day);
    return day.isAfter(today) ? today : day;
  }
}

/// Compact, locale-free date formatter ("25 Oct 2025"). Kept here because both
/// the status card and request cards render ISO dates as headers; routing them
/// through one formatter avoids the two screens drifting in style.
String formatShortDate(DateTime d) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year}';
}

/// Shared blood-group list. Order matches campus donor forms.
const List<String> kBloodGroups = [
  'A+',
  'A-',
  'B+',
  'B-',
  'O+',
  'O-',
  'AB+',
  'AB-',
];
