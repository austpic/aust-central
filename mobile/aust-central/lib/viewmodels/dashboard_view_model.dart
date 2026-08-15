import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/repositories/platform_repository.dart';
import 'package:aust_track/data/services/auth_service.dart';

/// Home dashboard.
///
/// Exposes each counter as **formatted display text or null**, rather than
/// leaving the view to decide what a raw number means. Null means "no figure
/// to show" — the card hides its chip entirely, because an empty pill reads as
/// zero, which is a different claim from "not loaded".
class DashboardViewModel extends BaseViewModel {
  final PlatformRepository _repo;
  final AuthService _auth;

  DashboardViewModel(this._repo, this._auth) {
    load();
  }

  Map<String, dynamic>? _data;

  bool get hasData => _data != null && !hasError;

  /// Falls back to the cached user while loading, so the header does not
  /// flicker through a placeholder on every open.
  String get greetingName {
    final fromServer = _data?['greetingName'] as String?;
    if (fromServer != null && fromServer.isNotEmpty) return fromServer;
    return _auth.currentUser?.lastName ?? 'there';
  }

  Future<void> load({bool silent = false}) => runLoad(() async {
        _data = await _repo.dashboard();
      }, silent: silent);

  /// Null while loading or on failure — see the class note.
  String? _chip(String Function(Map<String, dynamic> data) build) {
    final data = _data;
    if (data == null || hasError) return null;
    return build(data);
  }

  String? get tasksChip => _chip((d) {
        final due = d['tasksDueToday'] as int? ?? 0;
        return due == 0 ? 'Nothing due today' : '$due due today';
      });

  String? get classChip => _chip((d) {
        final next = d['nextClass'] as Map?;
        if (next == null) return 'No classes scheduled';
        return 'Next Class: ${next['classTime']}';
      });

  String? get cgpaChip => _chip((d) {
        // Null rather than 0.00 — "you have a 0.00 CGPA" would be alarming
        // and wrong for a student with no grades on record yet.
        final cgpa = d['cgpa'];
        return cgpa == null ? 'No grades yet' : 'Current: $cgpa';
      });

  String? get labReportChip => _chip((d) {
        final n = d['labReportDrafts'] as int? ?? 0;
        return n == 1 ? '1 Draft Saved' : '$n Drafts Saved';
      });

  String? get bloodChip => _chip((d) {
        final n = d['openBloodRequests'] as int? ?? 0;
        return n == 1 ? '1 open request' : '$n open requests';
      });

  String? get booksChip => _chip((d) {
        final n = d['activeListings'] as int? ?? 0;
        return n == 1 ? '1 listing' : '$n listings';
      });

  String? get lostFoundChip => _chip((d) {
        final n = d['openLostFoundItems'] as int? ?? 0;
        return '$n items';
      });

  int get unreadNotifications => (_data?['unreadNotifications'] as int?) ?? 0;

  String get noticeMessage {
    final notice = _chip((d) {
      final latest = d['latestNotice'] as Map?;
      return latest?['title'] as String? ?? 'No notices yet';
    });
    return notice ?? 'Loading notices…';
  }
}
