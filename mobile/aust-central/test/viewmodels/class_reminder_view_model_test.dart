import 'package:flutter_test/flutter_test.dart';

import 'package:aust_track/data/api/api_exception.dart';
import 'package:aust_track/viewmodels/class_reminder_view_model.dart';

import '../fakes/fake_academic_repository.dart';

Future<void> _settle() => Future<void>.delayed(Duration.zero);

void main() {
  group('ClassReminderViewModel', () {
    test('loads reminders and converts server time formats for display', () async {
      final repo = FakeAcademicRepository()
        ..reminders = [
          {
            'id': 'r1',
            'courseName': 'Database Systems',
            'weekday': 'TUESDAY',
            'classTime': '13:00',
            'isEnabled': true,
            'minutesBefore': 15,
            'assessments': [],
          },
        ];

      final vm = ClassReminderViewModel(repo);
      await _settle();

      expect(vm.reminders, hasLength(1));
      expect(vm.reminders.first.weekday, 'Tuesday');
      expect(vm.reminders.first.classTime, '1:00 PM');
      expect(vm.enabledCount, 1);
    });

    test('toggleReminder is optimistic and rolls back on failure', () async {
      final repo = FakeAcademicRepository()
        ..reminders = [
          {
            'id': 'r1',
            'courseName': 'Physics Lab',
            'weekday': 'MONDAY',
            'classTime': '17:00',
            'isEnabled': true,
            'minutesBefore': 10,
            'assessments': [],
          },
        ]
        ..updateReminderError = const ApiException(message: 'Could not save');

      final vm = ClassReminderViewModel(repo);
      await _settle();

      await vm.toggleReminder(0);

      expect(vm.reminders.first.isEnabled, isTrue, reason: 'rolled back after the server rejected it');
      expect(vm.error, 'Could not save');
    });

    test('addReminder reloads from the server rather than inserting locally', () async {
      final repo = FakeAcademicRepository()..reminders = [];
      final vm = ClassReminderViewModel(repo);
      await _settle();

      final loadsBeforeAdd = repo.loadCallCount;
      await vm.addReminder(
        courseName: 'Operating Systems',
        weekday: 'Wednesday',
        classTime: '10:00 AM',
      );

      // Reload rather than insert locally: the server sorts by campus
      // weekday order, which is not the order rows were created in.
      expect(repo.loadCallCount, loadsBeforeAdd + 1);
      expect(vm.reminders, hasLength(1));
      expect(vm.reminders.first.courseName, 'Operating Systems');
      // "10:00 AM" -> "10:00" sent to the server -> "10:00 AM" back for display.
      expect(vm.reminders.first.classTime, '10:00 AM');
    });
  });
}
