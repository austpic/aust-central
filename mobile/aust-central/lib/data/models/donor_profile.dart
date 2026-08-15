import 'package:flutter/foundation.dart';

/// The signed-in user's donor profile.
///
/// Carries the **server's** eligibility verdict rather than deriving one.
/// The 90-day donation interval is a medical rule, so it is evaluated in one
/// place — the API — and every client renders the same answer. A local
/// calculation would drift the moment the rule changed while older app builds
/// were still installed.
@immutable
class DonorProfile {
  final bool available;
  final String? bloodGroup;
  final DateTime? lastDonated;

  /// Server-evaluated. Defaults describe a donor with no recorded donation.
  final bool eligible;
  final int daysUntilEligible;

  /// 0.0–1.0 through the waiting window; 1.0 means eligible.
  final double progress;

  /// Ready-to-render copy, e.g. "12 days until eligible".
  final String statusCopy;

  const DonorProfile({
    required this.available,
    this.bloodGroup,
    this.lastDonated,
    this.eligible = true,
    this.daysUntilEligible = 0,
    this.progress = 1,
    this.statusCopy = 'No donation recorded yet',
  });

  static const empty = DonorProfile(available: false);

  factory DonorProfile.fromJson(Map<String, dynamic> json) => DonorProfile(
        available: json['available'] as bool? ?? false,
        bloodGroup: json['bloodGroup'] as String?,
        lastDonated: json['lastDonated'] == null
            ? null
            : DateTime.parse(json['lastDonated'] as String).toLocal(),
        eligible: json['eligible'] as bool? ?? true,
        daysUntilEligible: (json['daysUntilEligible'] as num?)?.toInt() ?? 0,
        progress: (json['progress'] as num?)?.toDouble() ?? 1,
        statusCopy: json['statusCopy'] as String? ?? 'No donation recorded yet',
      );

  /// Local edits only touch the fields the user controls. Eligibility is
  /// intentionally not copyable — it is replaced wholesale by the next
  /// server response.
  DonorProfile copyWith({
    bool? available,
    String? bloodGroup,
    DateTime? lastDonated,
    bool clearBloodGroup = false,
    bool clearLastDonated = false,
  }) {
    return DonorProfile(
      available: available ?? this.available,
      bloodGroup: clearBloodGroup ? null : (bloodGroup ?? this.bloodGroup),
      lastDonated: clearLastDonated ? null : (lastDonated ?? this.lastDonated),
      eligible: eligible,
      daysUntilEligible: daysUntilEligible,
      progress: progress,
      statusCopy: statusCopy,
    );
  }
}
