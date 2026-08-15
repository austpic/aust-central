import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Snapshot of the current user's donor profile. Plain immutable value type —
/// keep service methods returning these instead of leaking `SharedPreferences`
/// into UI code.
@immutable
class DonorProfile {
  final bool available;
  final String? bloodGroup;
  final DateTime? lastDonated;

  const DonorProfile({
    required this.available,
    this.bloodGroup,
    this.lastDonated,
  });

  static const empty =
      DonorProfile(available: false, bloodGroup: null, lastDonated: null);

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
      lastDonated:
          clearLastDonated ? null : (lastDonated ?? this.lastDonated),
    );
  }
}

/// Persistence layer for the donor profile. SharedPreferences keys live here —
/// never inline in widgets.
class DonorProfileService {
  DonorProfileService._();

  // Bumping the prefix invalidates old data if the schema ever changes.
  static const _kAvailable = 'bb_available_v1';
  static const _kBloodGroup = 'bb_blood_group_v1';
  static const _kLastDonated = 'bb_last_donated_v1';

  static Future<DonorProfile> load() async {
    final prefs = await SharedPreferences.getInstance();
    final available = prefs.getBool(_kAvailable) ?? false;
    final bloodGroup = prefs.getString(_kBloodGroup);
    final iso = prefs.getString(_kLastDonated);
    final lastDonated =
        (iso == null || iso.isEmpty) ? null : DateTime.tryParse(iso);
    return DonorProfile(
      available: available,
      bloodGroup: (bloodGroup == null || bloodGroup.isEmpty) ? null : bloodGroup,
      lastDonated: lastDonated,
    );
  }

  static Future<void> save(DonorProfile profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kAvailable, profile.available);
    if (profile.bloodGroup == null) {
      await prefs.remove(_kBloodGroup);
    } else {
      await prefs.setString(_kBloodGroup, profile.bloodGroup!);
    }
    if (profile.lastDonated == null) {
      await prefs.remove(_kLastDonated);
    } else {
      await prefs.setString(
          _kLastDonated, profile.lastDonated!.toIso8601String());
    }
  }
}
