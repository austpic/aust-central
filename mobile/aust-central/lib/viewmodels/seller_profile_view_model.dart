import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/repositories/community_repository.dart';

/// A seller's public profile: rating, reviews, and active listings.
class SellerProfileViewModel extends BaseViewModel {
  final CommunityRepository _repo;
  final String sellerId;

  SellerProfileViewModel(this._repo, {required this.sellerId}) {
    load();
  }

  List<Map<String, dynamic>> _reviews = [];
  List<Map<String, dynamic>> _listings = [];

  List<Map<String, dynamic>> get reviews => List.unmodifiable(_reviews);
  List<Map<String, dynamic>> get listings => List.unmodifiable(_listings);

  /// Null when nobody has reviewed them. Honest absence beats a fabricated
  /// score — every seller used to display a hardcoded 4.9.
  double? get averageRating {
    if (_reviews.isEmpty) return null;
    final total = _reviews.fold<int>(0, (sum, r) => sum + (r['rating'] as int));
    return total / _reviews.length;
  }

  int get reviewCount => _reviews.length;
  bool get canMessage => _listings.isNotEmpty;

  /// A conversation is keyed to a listing, so messaging targets their newest.
  String? get messageableListingId =>
      _listings.isEmpty ? null : _listings.first['id'] as String;

  String? get messageableListingTitle =>
      _listings.isEmpty ? null : _listings.first['title'] as String?;

  Future<void> load({bool silent = false}) => runLoad(() async {
        final results = await Future.wait([
          _repo.sellerReviews(sellerId),
          _repo.listings(),
        ]);
        _reviews = results[0];
        // Browse is already scoped to active listings; narrowing to this
        // seller keeps the profile to what is currently on offer.
        _listings = results[1]
            .where((l) => (l['seller'] as Map<String, dynamic>)['id'] == sellerId)
            .toList();
      }, silent: silent);
}
