import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/models/blood_request.dart';
import 'package:aust_track/data/repositories/community_repository.dart';

/// Submitting a blood request.
///
/// The request goes to the server, so it is visible to every student. It
/// previously went only to this device's storage, where no potential donor
/// could ever have seen it.
class BloodRequestFormViewModel extends BaseViewModel {
  final CommunityRepository _repo;

  BloodRequestFormViewModel(this._repo);

  bool _submitting = false;

  /// Field-level messages from the server, keyed by field name. The server's
  /// validation is stricter than the form's (contact-number shape, unit
  /// bounds), so its messages are the more useful ones to show.
  Map<String, List<String>> _fieldErrors = const {};

  bool get isSubmitting => _submitting;
  Map<String, List<String>> get fieldErrors => _fieldErrors;
  String? errorFor(String field) => _fieldErrors[field]?.first;

  /// @returns the created request on success, or null — check [errorMessage].
  Future<BloodRequest?> submit({
    required String patientName,
    required String bloodGroup,
    required String hospital,
    required String location,
    required int units,
    required BloodUrgency urgency,
    required DateTime requiredBy,
    required String contactNumber,
    required String notes,
  }) async {
    if (_submitting) return null;
    _submitting = true;
    _fieldErrors = const {};
    safeNotify();

    Map<String, dynamic>? created;
    final failure = await runAction(() async {
      created = await _repo.createBloodRequest(
        patientName: patientName,
        bloodGroup: bloodGroup,
        hospital: hospital,
        location: location,
        units: units,
        urgency: urgency.name.toUpperCase(),
        requiredBy: requiredBy,
        contactNumber: contactNumber,
        notes: notes,
      );
    });

    _submitting = false;

    if (failure != null) {
      setState(ViewState.error, error: failure);
      return null;
    }

    safeNotify();
    final json = created!;
    return BloodRequest(
      // Server-assigned; the old local `mine_<millis>` placeholder is gone.
      id: json['id'] as String,
      patientName: json['patientName'] as String,
      bloodGroup: json['bloodGroup'] as String,
      hospital: json['hospital'] as String,
      location: json['location'] as String? ?? '',
      units: (json['units'] as num).toInt(),
      urgency: urgency,
      requiredBy: DateTime.parse(json['requiredBy'] as String).toLocal(),
      contactNumber: json['contactNumber'] as String,
      notes: json['notes'] as String? ?? '',
    );
  }
}
