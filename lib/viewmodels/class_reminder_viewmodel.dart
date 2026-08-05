import 'package:flutter/foundation.dart';
import '../models/class_reminder_model.dart';

class ClassReminderViewModel extends ChangeNotifier {
  final List<ClassReminderModel> _reminders = [
    ClassReminderModel(courseName: 'Data Structures',weekday: 'Sunday', classTime: '10:00 AM',isEnabled: true, minutesBefore: 10),
    ClassReminderModel(courseName: 'Database Systems', weekday: 'Tuesday',classTime: '1:00 PM', isEnabled: true, minutesBefore: 15),
    ClassReminderModel(courseName: 'Digital Logic Design',weekday: 'Tuesday', classTime: '2:00 PM',isEnabled: false, minutesBefore: 5),
    ClassReminderModel(courseName: 'Discrete Mathematics',weekday: 'Tuesday',classTime: '3:00 PM', isEnabled: true, minutesBefore: 10),
    ClassReminderModel(courseName: 'English Composition',weekday: 'Monday',classTime: '4:00 PM', isEnabled: false, minutesBefore: 30),
    ClassReminderModel(courseName: 'Physics Lab',weekday: 'Monday', classTime: '5:00 PM', isEnabled: true, minutesBefore: 15),
  ];

  bool _isSaved = false;

  List<ClassReminderModel> get reminders => _reminders;
  bool get isSaved => _isSaved;

  int get enabledCount {
    int count = 0;
    for (final r in _reminders) {
      if (r.isEnabled) count++;
    }
    return count;
  }

  void toggleReminder(int index) {
    _reminders[index].isEnabled = !_reminders[index].isEnabled;
    _isSaved = false;
    notifyListeners();
  }

  void updateMinutesBefore(int index, int minutes) {
    _reminders[index].minutesBefore = minutes;
    _isSaved = false;
    notifyListeners();
  }
  void addReminder({
  required String courseName,
  required String weekday,
  required String classTime,
  int minutesBefore = 10,
}) {
  _reminders.add(
    ClassReminderModel(
      courseName: courseName,
      weekday: weekday,
      classTime: classTime,
      minutesBefore: minutesBefore,
    ),
  );

  _isSaved = false;
  notifyListeners();
}
  void saveSettings() {
    _isSaved = true;
    notifyListeners();
  }
}