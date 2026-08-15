import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/repositories/academic_repository.dart';

/// Lab report cover-page drafts.
///
/// The PDF itself is still rendered on-device; this only persists the ten form
/// fields so the same cover page can be regenerated without retyping them.
class LabReportViewModel extends BaseViewModel {
  final AcademicRepository _repo;

  LabReportViewModel(this._repo);

  /// Id of the draft being edited, so repeated saves update one row rather
  /// than piling up a new draft on every tap.
  String? _draftId;
  bool _saving = false;

  String? get draftId => _draftId;
  bool get isSaving => _saving;
  bool get isEditingExisting => _draftId != null;

  /// @returns null on success, or a message for the view to surface.
  Future<String?> saveDraft(Map<String, dynamic> fields) async {
    if (_saving) return null;
    _saving = true;
    safeNotify();

    Map<String, dynamic>? saved;
    final failure = await runAction(() async {
      saved = await _repo.saveLabReport(fields, id: _draftId);
    });

    if (failure == null && saved != null) {
      _draftId = saved!['id'] as String;
    }
    _saving = false;
    safeNotify();
    return failure;
  }
}
