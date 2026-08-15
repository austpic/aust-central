import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/api/api_exception.dart';
import 'package:aust_track/data/repositories/academic_repository.dart';
import 'package:aust_track/views/tasks/todo_list_screen.dart';

import '../fakes/fake_academic_repository.dart';

/// Wraps [TodoListScreen] the same way `main.dart` does at the app root — a
/// `Provider<AcademicRepository>` above a `MaterialApp` — so the screen's own
/// `context.read<AcademicRepository>()` resolves to the fake instead of a
/// real network client.
Widget _harness(AcademicRepository repo) => MultiProvider(
      providers: [Provider<AcademicRepository>.value(value: repo)],
      child: const MaterialApp(home: TodoListScreen()),
    );

void main() {
  group('TodoListScreen', () {
    testWidgets('renders tasks loaded from the repository', (tester) async {
      final repo = FakeAcademicRepository()
        ..tasks = [
          {'id': '1', 'title': 'Read Chapter 4', 'isDone': false, 'category': 'TODAY'},
          {'id': '2', 'title': 'Submit lab report', 'isDone': false, 'category': 'TODAY'},
        ];

      await tester.pumpWidget(_harness(repo));
      await tester.pumpAndSettle();

      expect(find.text('Read Chapter 4'), findsOneWidget);
      expect(find.text('Submit lab report'), findsOneWidget);
      expect(find.text('0 of 2 completed'), findsOneWidget);
    });

    testWidgets('shows the empty state when there are no tasks', (tester) async {
      final repo = FakeAcademicRepository()..tasks = [];

      await tester.pumpWidget(_harness(repo));
      await tester.pumpAndSettle();

      expect(find.text('Nothing to do yet'), findsOneWidget);
    });

    testWidgets('surfaces a retry affordance when the load fails', (tester) async {
      final repo = FakeAcademicRepository()
        ..listTasksError = const ApiException(message: 'Session expired', statusCode: 401);

      await tester.pumpWidget(_harness(repo));
      await tester.pumpAndSettle();

      expect(find.text('Session expired'), findsOneWidget);
      expect(find.text('Try again'), findsOneWidget);
    });

    testWidgets('tapping a task toggles it optimistically', (tester) async {
      final repo = FakeAcademicRepository()
        ..tasks = [
          {'id': '1', 'title': 'Read Chapter 4', 'isDone': false, 'category': 'TODAY'},
        ];

      await tester.pumpWidget(_harness(repo));
      await tester.pumpAndSettle();

      expect(find.text('0 of 1 completed'), findsOneWidget);

      // Keyed explicitly in production code: the toggle circle sits inside
      // an InkWell whose own tap opens the edit sheet, so a type-based finder
      // would risk hitting InkWell's internal gesture detector instead.
      await tester.tap(find.byKey(const ValueKey('task-toggle-1')));
      await tester.pumpAndSettle();

      expect(find.text('1 of 1 completed'), findsOneWidget);
      expect(repo.updateTaskCalls.single, {'id': '1', 'isDone': true});
    });
  });
}
