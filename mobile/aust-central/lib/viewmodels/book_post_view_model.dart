import 'dart:io';

import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/repositories/community_repository.dart';
import 'package:aust_track/data/repositories/platform_repository.dart';

/// Posting a book listing, including its photos.
class BookPostViewModel extends BaseViewModel {
  final CommunityRepository _community;
  final PlatformRepository _platform;

  BookPostViewModel(this._community, this._platform);

  /// Index order must match the segmented controls in the view.
  static const conditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];
  static const listingTypes = ['SALE', 'FREE', 'SWAP'];

  int _conditionIndex = 1;
  int _typeIndex = 2;
  bool _submitting = false;
  Map<String, List<String>> _fieldErrors = const {};

  int get conditionIndex => _conditionIndex;
  int get typeIndex => _typeIndex;
  bool get isSubmitting => _submitting;

  /// Only a fixed-price listing carries a price. The server rejects one on
  /// SWAP/FREE, so the view hides the field entirely rather than sending a
  /// stale value.
  bool get isSale => listingTypes[_typeIndex] == 'SALE';

  Map<String, List<String>> get fieldErrors => _fieldErrors;
  String? errorFor(String field) => _fieldErrors[field]?.first;

  void setCondition(int index) {
    _conditionIndex = index;
    safeNotify();
  }

  void setType(int index) {
    _typeIndex = index;
    safeNotify();
  }

  /// Upload photos, then create the listing.
  ///
  /// Images go first so the listing is only created once its attachments
  /// exist — the reverse order can leave a listing pointing at files that
  /// never arrived.
  ///
  /// @returns null on success, or a message for the view to surface.
  Future<String?> submit({
    required String title,
    required String courseCode,
    required String department,
    required String semester,
    required String description,
    int? priceBdt,
    List<File> images = const [],
  }) async {
    if (_submitting) return null;
    _submitting = true;
    _fieldErrors = const {};
    safeNotify();

    final failure = await runAction(() async {
      final imageIds = <String>[];
      for (final file in images) {
        imageIds.add(await _platform.uploadImage(file.path));
      }

      await _community.createListing(
        title: title,
        courseCode: courseCode,
        department: department,
        semester: semester,
        condition: conditions[_conditionIndex],
        listingType: listingTypes[_typeIndex],
        priceBdt: isSale ? priceBdt : null,
        description: description,
        imageIds: imageIds,
      );
    });

    _submitting = false;
    safeNotify();
    return failure;
  }
}
