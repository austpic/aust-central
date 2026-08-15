import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/models/blood_request.dart';
import 'package:aust_track/data/repositories/community_repository.dart';
import 'package:aust_track/data/models/donor_profile.dart';

/// Blood bank.
///
/// Eligibility is **not** computed here. The 90-day interval lives on the
/// server and arrives already evaluated, so a medical-adjacent rule cannot
/// drift between screens or between app versions still on students' phones.
/// This view model only carries the server's answer through to the UI.
class BloodBankViewModel extends BaseViewModel {
  final CommunityRepository _repo;

  BloodBankViewModel(this._repo) {
    load();
  }

  DonorProfile _profile = DonorProfile.empty;
  List<BloodRequest> _feed = const [];
  List<BloodRequest> _myRequests = const [];

  DonorProfile get profile => _profile;

  /// Community requests, excluding your own — those get their own section
  /// above, so listing them twice would be noise.
  List<BloodRequest> get feed => List.unmodifiable(_feed);
  List<BloodRequest> get myRequests => List.unmodifiable(_myRequests);

  Future<void> load({bool silent = false}) => runLoad(() async {
        final results = await Future.wait([
          _repo.donorProfile(),
          _repo.bloodRequests(),
          _repo.bloodRequests(mine: true),
        ]);

        final mine = (results[2] as List<Map<String, dynamic>>)
            .map(_requestFrom)
            .toList();
        final mineIds = mine.map((r) => r.id).toSet();

        _profile = DonorProfile.fromJson(results[0] as Map<String, dynamic>);
        _myRequests = mine;
        _feed = (results[1] as List<Map<String, dynamic>>)
            .map(_requestFrom)
            .where((r) => !mineIds.contains(r.id))
            .toList();
      }, silent: silent);

  Future<String?> saveProfile(DonorProfile next) async {
    final previous = _profile;
    _profile = next;
    safeNotify();

    Map<String, dynamic>? saved;
    final failure = await runAction(() async {
      saved = await _repo.updateDonorProfile(
        available: next.available,
        bloodGroup: next.bloodGroup,
        lastDonated: next.lastDonated,
      );
    });

    if (failure != null) {
      _profile = previous;
    } else if (saved != null) {
      // Adopt the server's copy — eligibility is computed there, so its view
      // of the profile is authoritative.
      _profile = DonorProfile.fromJson(saved!);
    }
    safeNotify();
    return failure;
  }

  Future<String?> cancelRequest(BloodRequest request) async {
    final failure = await runAction(
      () => _repo.setBloodRequestStatus(request.id, 'CANCELLED'),
    );
    if (failure == null) {
      _myRequests = _myRequests.where((r) => r.id != request.id).toList();
      safeNotify();
    }
    return failure;
  }

  static BloodRequest _requestFrom(Map<String, dynamic> json) => BloodRequest(
        id: json['id'] as String,
        patientName: json['patientName'] as String,
        bloodGroup: json['bloodGroup'] as String,
        hospital: json['hospital'] as String,
        location: json['location'] as String? ?? '',
        units: (json['units'] as num).toInt(),
        urgency:
            BloodUrgency.fromName((json['urgency'] as String).toLowerCase()),
        requiredBy: DateTime.parse(json['requiredBy'] as String).toLocal(),
        contactNumber: json['contactNumber'] as String,
        notes: json['notes'] as String? ?? '',
      );
}
