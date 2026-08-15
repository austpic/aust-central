import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/models/task.dart';
import 'package:aust_track/data/repositories/academic_repository.dart';

/// To-do list.
///
/// Owns the task collection, the active filter, and every write. The view
/// renders `visibleTasks` and dispatches intents; it holds no task state of
/// its own.
class TaskListViewModel extends BaseViewModel {
  final AcademicRepository _repo;

  TaskListViewModel(this._repo) {
    load();
  }

  final List<Task> _tasks = [];
  TaskFilter _filter = TaskFilter.all;

  List<Task> get tasks => List.unmodifiable(_tasks);
  TaskFilter get filter => _filter;
  int get completedCount => _tasks.where((t) => t.isDone).length;
  int get totalCount => _tasks.length;

  /// Filtering is local because the full list is already loaded and switching
  /// tabs should not cost a round trip.
  List<Task> get visibleTasks => switch (_filter) {
        TaskFilter.today =>
          _tasks.where((t) => t.category == TaskCategory.today && !t.isDone).toList(),
        TaskFilter.later =>
          _tasks.where((t) => t.category == TaskCategory.later && !t.isDone).toList(),
        TaskFilter.completed => _tasks.where((t) => t.isDone).toList(),
        TaskFilter.all => _tasks.where((t) => !t.isDone).toList(),
      };

  void setFilter(TaskFilter next) {
    if (_filter == next) return;
    _filter = next;
    safeNotify();
  }

  Future<void> load({bool silent = false}) => runLoad(() async {
        final rows = await _repo.listTasks();
        _tasks
          ..clear()
          ..addAll(rows.map(Task.fromJson));
      }, silent: silent);

  /// @returns null on success, or a message the view should surface.
  Future<String?> createTask({
    required String title,
    String note = '',
    TaskCategory category = TaskCategory.today,
    DateTime? dueDate,
  }) async {
    Map<String, dynamic>? created;
    final failure = await runAction(() async {
      created = await _repo.createTask(
        title: title,
        note: note,
        category: category.apiValue,
        dueDate: dueDate,
      );
    });

    if (failure == null && created != null) {
      // The id comes from the server, so the local list and the database agree.
      _tasks.insert(0, Task.fromJson(created!));
      safeNotify();
    }
    return failure;
  }

  Future<String?> updateTask(
    Task task, {
    required String title,
    required String note,
    required TaskCategory category,
    DateTime? dueDate,
  }) async {
    Map<String, dynamic>? updated;
    final failure = await runAction(() async {
      updated = await _repo.updateTask(
        task.id,
        title: title,
        note: note,
        category: category.apiValue,
        dueDate: dueDate,
        clearDueDate: dueDate == null,
      );
    });

    if (failure == null && updated != null) {
      final index = _tasks.indexWhere((t) => t.id == task.id);
      if (index != -1) _tasks[index] = Task.fromJson(updated!);
      safeNotify();
    }
    return failure;
  }

  /// Optimistic: the checkbox flips immediately and reverts if the write fails.
  Future<String?> toggleDone(String id) async {
    final task = _tasks.firstWhere((t) => t.id == id);
    final next = !task.isDone;

    task.isDone = next;
    safeNotify();

    final failure = await runAction(() => _repo.updateTask(id, isDone: next));
    if (failure != null) {
      task.isDone = !next;
      safeNotify();
    }
    return failure;
  }

  Future<String?> deleteTask(String id) async {
    final index = _tasks.indexWhere((t) => t.id == id);
    if (index == -1) return null;
    final removed = _tasks[index];

    _tasks.removeAt(index);
    safeNotify();

    final failure = await runAction(() => _repo.deleteTask(id));
    if (failure != null) {
      _tasks.insert(index, removed);
      safeNotify();
    }
    return failure;
  }

  Future<String?> clearAll() async {
    final doomed = List<Task>.from(_tasks);
    _tasks.clear();
    safeNotify();

    // No bulk-delete endpoint: deleting individually keeps the server's
    // per-row ownership check on every one of them.
    final failure = await runAction(
      () => Future.wait(doomed.map((t) => _repo.deleteTask(t.id))),
    );
    if (failure != null) await load();
    return failure;
  }
}
