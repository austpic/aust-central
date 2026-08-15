import 'package:aust_track/data/api/api_exception.dart';
import 'package:aust_track/data/repositories/academic_repository.dart';

/// In-memory stand-in for [AcademicRepository].
///
/// View models take their repository through the constructor precisely so a
/// test can hand them this instead of a real [AcademicRepository] wrapping a
/// live [ApiClient] — no HTTP, no server, no widget tree required.
///
/// Implements the class rather than extending it: Dart classes have an
/// implicit interface, and `implements` means every call here is one this
/// fake explicitly chose to support — nothing silently falls through to real
/// network code.
class FakeAcademicRepository implements AcademicRepository {
  // --- Tasks -----------------------------------------------------------
  List<Map<String, dynamic>> tasks = [];
  ApiException? listTasksError;
  ApiException? createTaskError;
  ApiException? updateTaskError;
  ApiException? deleteTaskError;

  final List<String> deletedTaskIds = [];
  final List<Map<String, dynamic>> updateTaskCalls = [];

  @override
  Future<List<Map<String, dynamic>>> listTasks({
    String filter = 'all',
    String? search,
  }) async {
    if (listTasksError != null) throw listTasksError!;
    return tasks;
  }

  @override
  Future<Map<String, dynamic>> createTask({
    required String title,
    String note = '',
    String category = 'TODAY',
    DateTime? dueDate,
  }) async {
    if (createTaskError != null) throw createTaskError!;
    final created = {
      'id': 'new-${tasks.length + 1}',
      'title': title,
      'note': note,
      'category': category,
      'isDone': false,
      'dueDate': dueDate?.toIso8601String(),
    };
    tasks = [created, ...tasks];
    return created;
  }

  @override
  Future<Map<String, dynamic>> updateTask(
    String id, {
    String? title,
    String? note,
    String? category,
    bool? isDone,
    DateTime? dueDate,
    bool clearDueDate = false,
  }) async {
    updateTaskCalls.add({'id': id, 'isDone': isDone});
    if (updateTaskError != null) throw updateTaskError!;
    final index = tasks.indexWhere((t) => t['id'] == id);
    final current = Map<String, dynamic>.from(tasks[index]);
    if (title != null) current['title'] = title;
    if (note != null) current['note'] = note;
    if (category != null) current['category'] = category;
    if (isDone != null) current['isDone'] = isDone;
    if (clearDueDate) current['dueDate'] = null;
    tasks[index] = current;
    return current;
  }

  @override
  Future<void> deleteTask(String id) async {
    deletedTaskIds.add(id);
    if (deleteTaskError != null) throw deleteTaskError!;
    tasks = tasks.where((t) => t['id'] != id).toList();
  }

  // --- Class reminders ---------------------------------------------------
  List<Map<String, dynamic>> reminders = [];
  ApiException? listRemindersError;
  ApiException? updateReminderError;
  int loadCallCount = 0;

  final List<Map<String, dynamic>> updateReminderCalls = [];

  @override
  Future<List<Map<String, dynamic>>> listClassReminders() async {
    loadCallCount++;
    if (listRemindersError != null) throw listRemindersError!;
    return reminders;
  }

  @override
  Future<Map<String, dynamic>?> nextClass() async => null;

  @override
  Future<Map<String, dynamic>> createClassReminder({
    required String courseName,
    required String weekday,
    required String classTime,
    bool isEnabled = true,
    int minutesBefore = 10,
  }) async {
    final created = {
      'id': 'reminder-${reminders.length + 1}',
      'courseName': courseName,
      'weekday': weekday,
      'classTime': classTime,
      'isEnabled': isEnabled,
      'minutesBefore': minutesBefore,
      'assessments': [],
    };
    reminders = [...reminders, created];
    return created;
  }

  @override
  Future<Map<String, dynamic>> updateClassReminder(
    String id, {
    bool? isEnabled,
    int? minutesBefore,
    String? courseName,
    String? weekday,
    String? classTime,
  }) async {
    updateReminderCalls.add({'id': id, 'isEnabled': isEnabled, 'minutesBefore': minutesBefore});
    if (updateReminderError != null) throw updateReminderError!;
    final index = reminders.indexWhere((r) => r['id'] == id);
    final current = Map<String, dynamic>.from(reminders[index]);
    if (isEnabled != null) current['isEnabled'] = isEnabled;
    if (minutesBefore != null) current['minutesBefore'] = minutesBefore;
    if (courseName != null) current['courseName'] = courseName;
    if (weekday != null) current['weekday'] = weekday;
    if (classTime != null) current['classTime'] = classTime;
    reminders[index] = current;
    return current;
  }

  @override
  Future<void> deleteClassReminder(String id) async {
    reminders = reminders.where((r) => r['id'] != id).toList();
  }

  @override
  Future<Map<String, dynamic>> addAssessment(
    String reminderId, {
    required String type,
    required DateTime dateTime,
  }) async {
    final index = reminders.indexWhere((r) => r['id'] == reminderId);
    final current = Map<String, dynamic>.from(reminders[index]);
    final assessments = List<Map<String, dynamic>>.from(
      current['assessments'] as List? ?? [],
    );
    assessments.add({'type': type, 'dateTime': dateTime.toIso8601String()});
    current['assessments'] = assessments;
    reminders[index] = current;
    return current;
  }

  @override
  Future<void> deleteAssessment(String reminderId, String assessmentId) async {}

  // --- Everything else: unused by the current test suite -----------------
  // Kept as explicit failures rather than silent no-ops, so a test that
  // starts depending on one of these fails loudly instead of getting a
  // quietly-wrong empty result.
  @override
  Future<Map<String, dynamic>> cgpaSummary() => _unimplemented('cgpaSummary');

  @override
  Future<Map<String, dynamic>> createSemester(String name) =>
      _unimplemented('createSemester');

  @override
  Future<void> deleteSemester(String id) => _unimplemented('deleteSemester');

  @override
  Future<Map<String, dynamic>> addCourse(
    String semesterId, {
    required String courseName,
    required double credits,
    required String grade,
  }) =>
      _unimplemented('addCourse');

  @override
  Future<Map<String, dynamic>> updateCourse(
    String semesterId,
    String courseId, {
    String? courseName,
    double? credits,
    String? grade,
  }) =>
      _unimplemented('updateCourse');

  @override
  Future<void> deleteCourse(String semesterId, String courseId) =>
      _unimplemented('deleteCourse');

  @override
  Future<Map<String, dynamic>> whatIf(
    List<({double credits, String grade})> courses,
  ) =>
      _unimplemented('whatIf');

  @override
  Future<List<Map<String, dynamic>>> listLabReports() =>
      _unimplemented('listLabReports');

  @override
  Future<Map<String, dynamic>> saveLabReport(Map<String, dynamic> fields, {String? id}) =>
      _unimplemented('saveLabReport');

  @override
  Future<void> deleteLabReport(String id) => _unimplemented('deleteLabReport');

  Never _unimplemented(String member) =>
      throw UnimplementedError('FakeAcademicRepository.$member was not stubbed for this test');
}
