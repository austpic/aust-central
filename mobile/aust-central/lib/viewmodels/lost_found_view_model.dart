import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/repositories/community_repository.dart';

/// Lost & Found.
///
/// Search, category, and lost/found filtering all run as server queries, so
/// they cover every item on campus rather than a page already in memory.
class LostFoundViewModel extends BaseViewModel {
  final CommunityRepository _repo;

  LostFoundViewModel(this._repo) {
    load();
  }

  List<Map<String, dynamic>> _items = [];
  List<String> _categories = [];
  String _selectedCategory = 'All';
  String _kind = 'FOUND';
  String _search = '';

  List<Map<String, dynamic>> get items => List.unmodifiable(_items);

  /// Built from categories actually in use, so a new one appears as soon as
  /// somebody reports an item under it.
  List<String> get categories => ['All', ..._categories];

  String get selectedCategory => _selectedCategory;
  String get kind => _kind;
  bool get isEmpty => _items.isEmpty;

  Future<void> setCategory(String next) {
    _selectedCategory = next;
    return load();
  }

  Future<void> setKind(String next) {
    _kind = next;
    return load();
  }

  Future<void> setSearch(String next) {
    _search = next.trim();
    return load();
  }

  Future<void> load({bool silent = false}) => runLoad(() async {
        final results = await Future.wait([
          _repo.lostFoundItems(
            search: _search.isEmpty ? null : _search,
            category: _selectedCategory == 'All' ? null : _selectedCategory,
            kind: _kind,
          ),
          _repo.lostFoundCategories(),
        ]);
        _items = results[0] as List<Map<String, dynamic>>;
        _categories = results[1] as List<String>;
      }, silent: silent);

  /// "27 Feb 2025" — locale-free, matching the rest of the app.
  static String formatDate(String iso) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final d = DateTime.parse(iso).toLocal();
    return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year}';
  }
}
