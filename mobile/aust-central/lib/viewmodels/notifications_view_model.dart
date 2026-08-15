import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/models/app_notification.dart';
import 'package:aust_track/data/repositories/platform_repository.dart';

/// Notification inbox.
///
/// Read state is persisted server-side so the unread badge agrees across
/// devices. Marking read is optimistic — the visual change is immediate and
/// reverts if the write fails.
class NotificationsViewModel extends BaseViewModel {
  final PlatformRepository _repo;

  NotificationsViewModel(this._repo) {
    load();
  }

  List<AppNotification> _items = [];

  List<AppNotification> get items => List.unmodifiable(_items);
  int get unreadCount => _items.where((n) => !n.isRead).length;
  bool get isEmpty => _items.isEmpty;

  Future<void> load({bool silent = false}) => runLoad(() async {
        final rows = await _repo.notifications();
        _items = rows.map(AppNotification.fromJson).toList();
      }, silent: silent);

  Future<String?> markRead(AppNotification item) async {
    if (item.isRead) return null;

    final index = _items.indexOf(item);
    if (index == -1) return null;

    _items[index] = item.copyWith(readAt: DateTime.now());
    safeNotify();

    final failure = await runAction(() => _repo.markRead(item.id));
    if (failure != null) {
      _items[index] = item;
      safeNotify();
    }
    return failure;
  }

  Future<String?> markAllRead() async {
    final previous = List<AppNotification>.from(_items);
    final now = DateTime.now();

    _items = _items.map((n) => n.isRead ? n : n.copyWith(readAt: now)).toList();
    safeNotify();

    final failure = await runAction(() => _repo.markAllRead());
    if (failure != null) {
      _items = previous;
      safeNotify();
    }
    return failure;
  }
}
