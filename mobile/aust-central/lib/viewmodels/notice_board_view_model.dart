import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/repositories/community_repository.dart';
import 'package:aust_track/data/models/notice.dart';

/// Notice board.
///
/// Category and search filtering are server-side queries, so the list is never
/// capped by whatever happened to be fetched into memory.
class NoticeBoardViewModel extends BaseViewModel {
  final CommunityRepository _repo;

  NoticeBoardViewModel(this._repo) {
    load();
  }

  List<Notice> _notices = [];
  NoticeCategory? _category;
  String _search = '';

  /// Ids currently expanded to full body text. Presentation state, but it must
  /// survive a rebuild, so it lives here rather than in the widget.
  final Set<String> _expanded = {};

  List<Notice> get notices => List.unmodifiable(_notices);
  NoticeCategory? get category => _category;
  bool get isEmpty => _notices.isEmpty;

  bool isExpanded(String id) => _expanded.contains(id);

  void toggleExpanded(String id) {
    if (!_expanded.remove(id)) _expanded.add(id);
    safeNotify();
  }

  Future<void> setCategory(NoticeCategory? next) {
    _category = next;
    return load();
  }

  Future<void> setSearch(String next) {
    _search = next.trim();
    return load();
  }

  Future<void> load({bool silent = false}) => runLoad(() async {
        final rows = await _repo.listNotices(
          category: _category?.name.toUpperCase(),
          search: _search.isEmpty ? null : _search,
        );
        _notices = rows.map(_fromJson).toList();
      }, silent: silent);

  Notice _fromJson(Map<String, dynamic> json) => Notice(
        id: json['id'] as String,
        title: json['title'] as String,
        body: json['body'] as String,
        postedAt: DateTime.parse(json['postedAt'] as String).toLocal(),
        category: _categoryFrom(json['category'] as String),
        pinned: json['pinned'] as bool? ?? false,
      );

  static NoticeCategory _categoryFrom(String raw) => switch (raw) {
        'ACADEMIC' => NoticeCategory.academic,
        'EXAM' => NoticeCategory.exam,
        'EVENT' => NoticeCategory.event,
        _ => NoticeCategory.general,
      };
}
