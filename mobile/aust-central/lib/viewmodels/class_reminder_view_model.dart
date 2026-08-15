import 'package:flutter/foundation.dart';

import 'package:aust_track/data/api/api_exception.dart';
import 'package:aust_track/data/models/class_reminder_model.dart';
import 'package:aust_track/data/repositories/academic_repository.dart';

/// Class reminders, backed by the API.
///
/// Previously held six hardcoded reminders in a list literal; toggling one
/// changed nothing beyond this object's lifetime. Reminders now belong to the
/// signed-in user on the server, so they persist and follow them between
/// devices.
///
/// Writes are optimistic — the switch flips immediately and rolls back if the
/// server rejects it — because a reminder toggle should feel instant.
class ClassReminderViewModel extends ChangeNotifier {
  final AcademicRepository _repo;

  ClassReminderViewModel(this._repo) {
    load();
  }

  final List<ClassReminderModel> _reminders = [];
  // Server ids, parallel to _reminders. Kept out of the model so the widget
  // layer keeps working against the same shape it always did.
  final List<String> _ids = [];

  bool _loading = true;
  bool _isSaved = false;
  String? _error;

  List<ClassReminderModel> get reminders => List.unmodifiable(_reminders);
  bool get isLoading => _loading;
  bool get isSaved => _isSaved;
  String? get error => _error;

  int get enabledCount => _reminders.where((r) => r.isEnabled).length;

  static const _weekdayNames = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
  ];

  /// "10:00 AM" (what the UI collects) → "10:00" (what the API stores).
  static String _to24Hour(String display) {
    final match = RegExp(r'^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$').firstMatch(display.trim());
    if (match == null) return display;
    var hour = int.parse(match.group(1)!);
    final minute = match.group(2)!;
    final meridiem = match.group(3)?.toUpperCase();
    if (meridiem == 'PM' && hour != 12) hour += 12;
    if (meridiem == 'AM' && hour == 12) hour = 0;
    return '${hour.toString().padLeft(2, '0')}:$minute';
  }

  /// "13:00" → "1:00 PM", for display.
  static String _to12Hour(String raw) {
    final parts = raw.split(':');
    if (parts.length != 2) return raw;
    final hour = int.tryParse(parts[0]) ?? 0;
    final suffix = hour >= 12 ? 'PM' : 'AM';
    final display = hour % 12 == 0 ? 12 : hour % 12;
    return '$display:${parts[1]} $suffix';
  }

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final rows = await _repo.listClassReminders();
      _reminders.clear();
      _ids.clear();
      for (final row in rows) {
        _ids.add(row['id'] as String);
        _reminders.add(
          ClassReminderModel(
            courseName: row['courseName'] as String,
            weekday: _titleCase(row['weekday'] as String),
            classTime: _to12Hour(row['classTime'] as String),
            isEnabled: row['isEnabled'] as bool? ?? true,
            minutesBefore: (row['minutesBefore'] as num?)?.toInt() ?? 10,
            assessments: ((row['assessments'] as List?) ?? [])
                .map((a) => AssessmentReminder(
                      type: _assessmentType(a['type'] as String),
                      dateTime: DateTime.parse(a['dateTime'] as String).toLocal(),
                    ))
                .toList(),
          ),
        );
      }
    } on ApiException catch (e) {
      _error = e.message;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  static String _titleCase(String value) =>
      value[0] + value.substring(1).toLowerCase();

  static AssessmentType _assessmentType(String raw) {
    switch (raw) {
      case 'QUIZ':
        return AssessmentType.quiz;
      case 'LAB':
        return AssessmentType.lab;
      default:
        return AssessmentType.mid;
    }
  }

  Future<void> toggleReminder(int index) async {
    final reminder = _reminders[index];
    final next = !reminder.isEnabled;

    reminder.isEnabled = next;
    _isSaved = false;
    notifyListeners();

    try {
      await _repo.updateClassReminder(_ids[index], isEnabled: next);
    } on ApiException catch (e) {
      reminder.isEnabled = !next;
      _error = e.message;
      notifyListeners();
    }
  }

  Future<void> updateMinutesBefore(int index, int minutes) async {
    final reminder = _reminders[index];
    final previous = reminder.minutesBefore;

    reminder.minutesBefore = minutes;
    _isSaved = false;
    notifyListeners();

    try {
      await _repo.updateClassReminder(_ids[index], minutesBefore: minutes);
    } on ApiException catch (e) {
      reminder.minutesBefore = previous;
      _error = e.message;
      notifyListeners();
    }
  }

  Future<void> addReminder({
    required String courseName,
    required String weekday,
    required String classTime,
    int minutesBefore = 10,
  }) async {
    try {
      await _repo.createClassReminder(
        courseName: courseName,
        weekday: weekday.toUpperCase(),
        classTime: _to24Hour(classTime),
        minutesBefore: minutesBefore,
      );
      // Reload rather than insert locally: the server sorts by campus weekday
      // order, which is not the order rows were created in.
      await load();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    }
  }

  Future<void> addAssessmentReminder(
    int index, {
    required AssessmentType type,
    required DateTime dateTime,
  }) async {
    try {
      await _repo.addAssessment(
        _ids[index],
        type: type.name.toUpperCase(),
        dateTime: dateTime,
      );
      await load();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    }
  }

  Future<void> deleteReminder(int index) async {
    final id = _ids[index];
    try {
      await _repo.deleteClassReminder(id);
      await load();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    }
  }

  /// Every change is already persisted as it happens, so this only drives the
  /// "Saved" confirmation the UI shows.
  void saveSettings() {
    _isSaved = true;
    notifyListeners();
  }

  int get weekdayCount => _weekdayNames.length;
}
