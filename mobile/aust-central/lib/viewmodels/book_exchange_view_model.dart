import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/repositories/community_repository.dart';

/// Book exchange browse screen.
///
/// Tabs, sorting, and the saved list are all server-side queries — the screen
/// once sorted two hardcoded maps in memory, so "Saved" could only ever hold
/// those two and no other student's books existed at all.
class BookExchangeViewModel extends BaseViewModel {
  final CommunityRepository _repo;

  BookExchangeViewModel(this._repo) {
    load();
  }

  /// Index order matches the tab and filter rows in the view.
  static const _tabs = ['browse', 'mine', 'saved'];
  static const _sorts = ['department', 'courseCode', 'semester', 'freeFirst'];

  int _selectedTab = 0;
  int _selectedFilter = 1;
  List<Map<String, String>> _books = [];
  final Set<String> _bookmarkedIds = {};

  int get selectedTab => _selectedTab;
  int get selectedFilter => _selectedFilter;
  List<Map<String, String>> get books => List.unmodifiable(_books);
  bool get isEmpty => _books.isEmpty;

  bool isBookmarked(String id) => _bookmarkedIds.contains(id);

  String get emptyMessage => switch (_selectedTab) {
        1 => "You haven't listed any books yet",
        2 => 'Nothing saved yet',
        _ => 'No listings right now',
      };

  Future<void> selectTab(int index) {
    _selectedTab = index;
    return load();
  }

  Future<void> selectFilter(int index) {
    _selectedFilter = index;
    return load();
  }

  Future<void> load({bool silent = false}) => runLoad(() async {
        final rows = await _repo.listings(
          tab: _tabs[_selectedTab],
          sort: _sorts[_selectedFilter],
        );

        _bookmarkedIds
          ..clear()
          ..addAll(rows
              .where((r) => r['isBookmarked'] == true)
              .map((r) => r['id'] as String));

        _books = rows.map(_toCardMap).toList();
      }, silent: silent);

  /// Saved listings persist per user, so the Saved tab survives a reinstall.
  Future<String?> toggleBookmark(String id) async {
    final saved = !_bookmarkedIds.contains(id);
    saved ? _bookmarkedIds.add(id) : _bookmarkedIds.remove(id);
    safeNotify();

    final failure = await runAction(() => _repo.setBookmark(id, saved));
    if (failure != null) {
      saved ? _bookmarkedIds.remove(id) : _bookmarkedIds.add(id);
      safeNotify();
    } else if (!saved && _selectedTab == 2) {
      // Un-saving while viewing Saved should drop the card from the list.
      await load(silent: true);
    }
    return failure;
  }

  /// Flatten a listing into the string map the existing card widgets expect,
  /// so the presentation layer did not have to be rewritten.
  static Map<String, String> _toCardMap(Map<String, dynamic> row) {
    final seller = row['seller'] as Map<String, dynamic>;
    final type = row['listingType'] as String;
    final price = row['priceBdt'];
    final rating = seller['rating'];

    return {
      'id': row['id'] as String,
      'title': row['title'] as String,
      'course': row['courseCode'] as String,
      'department': row['department'] as String,
      'semester': row['semester'] as String,
      'condition': _conditionLabel(row['condition'] as String),
      // SALE shows a price; SWAP/FREE show what they are.
      'tag': type == 'SALE' ? '$price BDT' : (type == 'FREE' ? 'Free' : 'Swap'),
      'seller': seller['name'] as String,
      'sellerId': seller['id'] as String,
      // No reviews yet means no rating — a dash, not an invented 4.9.
      'rating': rating == null ? '—' : rating.toString(),
      'image': 'assets/images/book_placeholder.png',
    };
  }

  static String _conditionLabel(String raw) => switch (raw) {
        'NEW' => 'New',
        'LIKE_NEW' => 'Like New',
        'GOOD' => 'Good',
        'FAIR' => 'Fair',
        _ => 'Poor',
      };
}
