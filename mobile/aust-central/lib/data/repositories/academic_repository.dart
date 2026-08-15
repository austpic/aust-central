import 'package:aust_track/data/api/api_client.dart';

/// Tasks, class reminders, CGPA, and lab report drafts.
///
/// Repositories return plain maps/typed records rather than re-deriving model
/// classes for every endpoint: the server response shapes are already the
/// contract, and duplicating them in Dart is where drift creeps in. Screens
/// that already have a model (Task, ClassReminderModel) map at their own edge.
class AcademicRepository {
  final ApiClient _client;
  const AcademicRepository(this._client);

  // --- Tasks ---------------------------------------------------------------

  /// [filter] is one of: all, today, later, completed.
  Future<List<Map<String, dynamic>>> listTasks({
    String filter = 'all',
    String? search,
  }) async {
    final data = await _client.get('/tasks', query: {
      'filter': filter,
      'search': search,
      'limit': 100,
    });
    return _items(data);
  }

  Future<Map<String, dynamic>> createTask({
    required String title,
    String note = '',
    String category = 'TODAY',
    DateTime? dueDate,
  }) async {
    final data = await _client.post('/tasks', body: {
      'title': title,
      'note': note,
      'category': category,
      if (dueDate != null) 'dueDate': dueDate.toUtc().toIso8601String(),
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateTask(
    String id, {
    String? title,
    String? note,
    String? category,
    bool? isDone,
    DateTime? dueDate,
    bool clearDueDate = false,
  }) async {
    final data = await _client.patch('/tasks/$id', body: {
      'title': ?title,
      'note': ?note,
      'category': ?category,
      'isDone': ?isDone,
      // null clears the date server-side; omitting the key leaves it alone.
      if (clearDueDate) 'dueDate': null
      else if (dueDate != null) 'dueDate': dueDate.toUtc().toIso8601String(),
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> deleteTask(String id) => _client.delete('/tasks/$id');

  // --- Class reminders -----------------------------------------------------

  Future<List<Map<String, dynamic>>> listClassReminders() async {
    final data = await _client.get('/class-reminders');
    return List<Map<String, dynamic>>.from(
      (data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<Map<String, dynamic>?> nextClass() async {
    final data = await _client.get('/class-reminders/next');
    return data == null ? null : Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> createClassReminder({
    required String courseName,
    required String weekday,
    required String classTime,
    bool isEnabled = true,
    int minutesBefore = 10,
  }) async {
    final data = await _client.post('/class-reminders', body: {
      'courseName': courseName,
      'weekday': weekday,
      'classTime': classTime,
      'isEnabled': isEnabled,
      'minutesBefore': minutesBefore,
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateClassReminder(
    String id, {
    bool? isEnabled,
    int? minutesBefore,
    String? courseName,
    String? weekday,
    String? classTime,
  }) async {
    final data = await _client.patch('/class-reminders/$id', body: {
      'isEnabled': ?isEnabled,
      'minutesBefore': ?minutesBefore,
      'courseName': ?courseName,
      'weekday': ?weekday,
      'classTime': ?classTime,
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> deleteClassReminder(String id) =>
      _client.delete('/class-reminders/$id');

  /// Attach a quiz/mid/lab date to a reminder. Returns the updated reminder.
  Future<Map<String, dynamic>> addAssessment(
    String reminderId, {
    required String type,
    required DateTime dateTime,
  }) async {
    final data = await _client.post(
      '/class-reminders/$reminderId/assessments',
      body: {'type': type, 'dateTime': dateTime.toUtc().toIso8601String()},
    );
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> deleteAssessment(String reminderId, String assessmentId) =>
      _client.delete('/class-reminders/$reminderId/assessments/$assessmentId');

  // --- CGPA ----------------------------------------------------------------

  /// Full transcript with per-semester GPA and a running cumulative CGPA.
  /// All arithmetic happens server-side — see server/src/modules/cgpa.
  Future<Map<String, dynamic>> cgpaSummary() async {
    final data = await _client.get('/cgpa/summary');
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> createSemester(String name) async {
    final data = await _client.post('/cgpa/semesters', body: {'name': name});
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> deleteSemester(String id) =>
      _client.delete('/cgpa/semesters/$id');

  Future<Map<String, dynamic>> addCourse(
    String semesterId, {
    required String courseName,
    required double credits,
    required String grade,
  }) async {
    final data = await _client.post('/cgpa/semesters/$semesterId/courses', body: {
      'courseName': courseName,
      'credits': credits,
      'grade': grade,
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> updateCourse(
    String semesterId,
    String courseId, {
    String? courseName,
    double? credits,
    String? grade,
  }) async {
    final data = await _client.patch(
      '/cgpa/semesters/$semesterId/courses/$courseId',
      body: {
        'courseName': ?courseName,
        'credits': ?credits,
        'grade': ?grade,
      },
    );
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> deleteCourse(String semesterId, String courseId) =>
      _client.delete('/cgpa/semesters/$semesterId/courses/$courseId');

  /// Project hypothetical courses without saving them.
  Future<Map<String, dynamic>> whatIf(
    List<({double credits, String grade})> courses,
  ) async {
    final data = await _client.post('/cgpa/what-if', body: {
      'courses': courses
          .map((c) => {'credits': c.credits, 'grade': c.grade})
          .toList(),
    });
    return Map<String, dynamic>.from(data as Map);
  }

  // --- Lab report drafts ---------------------------------------------------

  Future<List<Map<String, dynamic>>> listLabReports() async {
    final data = await _client.get('/lab-reports', query: {'limit': 50});
    return _items(data);
  }

  Future<Map<String, dynamic>> saveLabReport(Map<String, dynamic> fields,
      {String? id}) async {
    final data = id == null
        ? await _client.post('/lab-reports', body: fields)
        : await _client.patch('/lab-reports/$id', body: fields);
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> deleteLabReport(String id) => _client.delete('/lab-reports/$id');

  List<Map<String, dynamic>> _items(dynamic data) =>
      List<Map<String, dynamic>>.from(
        ((data as Map)['items'] as List).map((e) => Map<String, dynamic>.from(e as Map)),
      );
}
