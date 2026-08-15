import 'package:flutter_test/flutter_test.dart';

import 'package:aust_track/core/base_view_model.dart';
import 'package:aust_track/data/api/api_exception.dart';
import 'package:aust_track/data/models/task.dart';
import 'package:aust_track/viewmodels/task_list_view_model.dart';

import '../fakes/fake_academic_repository.dart';

/// Waits for the pending microtasks a view model's async constructor kicks
/// off (`load()` inside the constructor) to settle, without needing a widget
/// pump. `flutter_test`'s zone-aware `pumpEventQueue` from `flutter_test`
/// isn't available outside WidgetTester, so a couple of event-loop turns is
/// the plain-Dart equivalent.
Future<void> _settle() => Future<void>.delayed(Duration.zero);

void main() {
  group('TaskListViewModel', () {
    test('loads tasks from the repository on construction', () async {
      final repo = FakeAcademicRepository()
        ..tasks = [
          {'id': '1', 'title': 'Read Chapter 4', 'isDone': false, 'category': 'TODAY'},
          {'id': '2', 'title': 'Submit lab report', 'isDone': true, 'category': 'LATER'},
        ];

      final vm = TaskListViewModel(repo);
      await _settle();

      expect(vm.state, ViewState.idle);
      expect(vm.totalCount, 2);
      expect(vm.completedCount, 1);
      expect(vm.tasks.map((t) => t.title), ['Read Chapter 4', 'Submit lab report']);
    });

    test('surfaces a server failure as an error state', () async {
      final repo = FakeAcademicRepository()
        ..listTasksError = const ApiException(message: 'Session expired', statusCode: 401);

      final vm = TaskListViewModel(repo);
      await _settle();

      expect(vm.state, ViewState.error);
      expect(vm.errorMessage, 'Session expired');
      expect(vm.tasks, isEmpty);
    });

    test('visibleTasks filters without a round trip', () async {
      final repo = FakeAcademicRepository()
        ..tasks = [
          {'id': '1', 'title': 'Today task', 'isDone': false, 'category': 'TODAY'},
          {'id': '2', 'title': 'Later task', 'isDone': false, 'category': 'LATER'},
          {'id': '3', 'title': 'Done task', 'isDone': true, 'category': 'TODAY'},
        ];
      final vm = TaskListViewModel(repo);
      await _settle();

      vm.setFilter(TaskFilter.today);
      expect(vm.visibleTasks.map((t) => t.title), ['Today task']);

      vm.setFilter(TaskFilter.later);
      expect(vm.visibleTasks.map((t) => t.title), ['Later task']);

      vm.setFilter(TaskFilter.completed);
      expect(vm.visibleTasks.map((t) => t.title), ['Done task']);

      // 'all' shows every not-done task, matching the tabs on the real screen.
      vm.setFilter(TaskFilter.all);
      expect(vm.visibleTasks.length, 2);
    });

    test('createTask inserts the server-assigned row at the top', () async {
      final repo = FakeAcademicRepository()..tasks = [];
      final vm = TaskListViewModel(repo);
      await _settle();

      final failure = await vm.createTask(title: 'New task');

      expect(failure, isNull);
      expect(vm.tasks, hasLength(1));
      expect(vm.tasks.first.title, 'New task');
      expect(vm.tasks.first.id, 'new-1');
    });

    test('toggleDone flips immediately and rolls back on failure', () async {
      final repo = FakeAcademicRepository()
        ..tasks = [
          {'id': '1', 'title': 'Task', 'isDone': false, 'category': 'TODAY'},
        ]
        ..updateTaskError = const ApiException(message: 'Network error');
      final vm = TaskListViewModel(repo);
      await _settle();

      final failure = await vm.toggleDone('1');

      // The optimistic flip is undone once the write comes back failed.
      expect(failure, 'Network error');
      expect(vm.tasks.first.isDone, isFalse);
    });

    test('toggleDone persists when the write succeeds', () async {
      final repo = FakeAcademicRepository()
        ..tasks = [
          {'id': '1', 'title': 'Task', 'isDone': false, 'category': 'TODAY'},
        ];
      final vm = TaskListViewModel(repo);
      await _settle();

      final failure = await vm.toggleDone('1');

      expect(failure, isNull);
      expect(vm.tasks.first.isDone, isTrue);
      expect(repo.updateTaskCalls.single, {'id': '1', 'isDone': true});
    });

    test('deleteTask removes optimistically and restores on failure', () async {
      final repo = FakeAcademicRepository()
        ..tasks = [
          {'id': '1', 'title': 'Keep me', 'isDone': false, 'category': 'TODAY'},
        ]
        ..deleteTaskError = const ApiException(message: 'Could not delete');
      final vm = TaskListViewModel(repo);
      await _settle();

      final failure = await vm.deleteTask('1');

      expect(failure, 'Could not delete');
      // Restored: a failed delete must not silently drop the row from view.
      expect(vm.tasks, hasLength(1));
      expect(vm.tasks.first.id, '1');
    });
  });
}
