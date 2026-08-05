import 'package:flutter/foundation.dart';
import '../models/class_reminder_model.dart';

class ClassReminderViewModel extends ChangeNotifier {
  final List<ClassReminderModel> _reminders = [
    ClassReminderModel(courseName: 'Data Structures', isEnabled: true, minutesBefore: 10),
    ClassReminderModel(courseName: 'Database Systems', isEnabled: true, minutesBefore: 15),
    ClassReminderModel(courseName: 'Digital Logic Design', isEnabled: false, minutesBefore: 5),
    ClassReminderModel(courseName: 'Discrete Mathematics', isEnabled: true, minutesBefore: 10),
    ClassReminderModel(courseName: 'English Composition', isEnabled: false, minutesBefore: 30),
    ClassReminderModel(courseName: 'Physics Lab', isEnabled: true, minutesBefore: 15),
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

  void saveSettings() {
    _isSaved = true;
    notifyListeners();
  }
}