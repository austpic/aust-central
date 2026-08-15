import 'package:flutter/foundation.dart';

import 'package:aust_track/data/api/api_exception.dart';
import 'package:aust_track/data/models/course_grade_model.dart';
import 'package:aust_track/data/repositories/academic_repository.dart';

/// CGPA calculator, backed by the API.
///
/// The courses and semester history were hardcoded literals; they are now the
/// signed-in student's real record.
///
/// GPA figures come from the server, which owns the grade scale. The local
/// getters below still compute a value so the UI updates the instant a grade
/// dropdown changes — but anything persisted is recomputed server-side, so the
/// two can never disagree about what is on record.
class CGPACalculatorViewModel extends ChangeNotifier {
  final AcademicRepository _repo;

  CGPACalculatorViewModel(this._repo) {
    load();
  }

  final List<CourseGradeModel> _courses = [];
  List<SemesterRecord> _semesterHistory = const [];

  /// Server ids parallel to _courses, plus the semester each belongs to.
  final List<({String courseId, String semesterId})> _courseRefs = [];

  bool _loading = true;
  bool _isCalculated = false;
  String? _error;
  double _serverCgpa = 0;
  double _serverCredits = 0;

  List<CourseGradeModel> get courses => List.unmodifiable(_courses);
  List<SemesterRecord> get semesterHistory => _semesterHistory;
  bool get isCalculated => _isCalculated;
  bool get isLoading => _loading;
  String? get error => _error;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final summary = await _repo.cgpaSummary();
      final semesters = (summary['semesters'] as List).cast<Map<String, dynamic>>();

      _semesterHistory = semesters
          .map((s) => SemesterRecord(
                semesterName: s['name'] as String,
                semesterGpa: (s['gpa'] as num).toDouble(),
                cumulativeCgpa: (s['cumulativeCgpa'] as num).toDouble(),
                totalCredits: (s['totalCredits'] as num).round(),
              ))
          .toList();

      _courses.clear();
      _courseRefs.clear();
      // The current semester is the last one — that is the set the calculator
      // screen lets you edit.
      if (semesters.isNotEmpty) {
        final current = semesters.last;
        for (final course in (current['courses'] as List).cast<Map<String, dynamic>>()) {
          _courseRefs.add((
            courseId: course['id'] as String,
            semesterId: current['id'] as String,
          ));
          _courses.add(CourseGradeModel(
            courseName: course['courseName'] as String,
            credits: (course['credits'] as num).toDouble(),
            grade: _displayGrade(course['grade'] as String),
          ));
        }
      }

      _serverCgpa = (summary['cgpa'] as num).toDouble();
      _serverCredits = (summary['totalCredits'] as num).toDouble();
    } on ApiException catch (e) {
      _error = e.message;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// "A_PLUS" ⇄ "A+" — the API uses enum-safe names, the UI uses the printed form.
  static String _displayGrade(String apiGrade) => switch (apiGrade) {
        'A_PLUS' => 'A+',
        'A_MINUS' => 'A-',
        'B_PLUS' => 'B+',
        'B_MINUS' => 'B-',
        _ => apiGrade,
      };

  static String _apiGrade(String display) => switch (display) {
        'A+' => 'A_PLUS',
        'A-' => 'A_MINUS',
        'B+' => 'B_PLUS',
        'B-' => 'B_MINUS',
        _ => display,
      };

  double get semesterGpa {
    double points = 0;
    double credits = 0;
    for (final course in _courses) {
      points += course.credits * course.gradePoint;
      credits += course.credits;
    }
    return credits == 0 ? 0 : points / credits;
  }

  /// The server's figure once loaded; falls back to the local blend before then.
  double get cumulativeCgpa => _serverCgpa;

  double get totalCurrentCredits {
    double total = 0;
    for (final course in _courses) {
      total += course.credits;
    }
    return total;
  }

  Future<void> updateGrade(int index, String newGrade) async {
    final previous = _courses[index].grade;
    _courses[index].grade = newGrade;
    _isCalculated = false;
    notifyListeners();

    if (index >= _courseRefs.length) return;
    final ref = _courseRefs[index];

    try {
      await _repo.updateCourse(
        ref.semesterId,
        ref.courseId,
        grade: _apiGrade(newGrade),
      );
      // Refresh so the cumulative figure reflects the change rather than
      // silently going stale against the edited grade.
      final summary = await _repo.cgpaSummary();
      _serverCgpa = (summary['cgpa'] as num).toDouble();
      _serverCredits = (summary['totalCredits'] as num).toDouble();
      notifyListeners();
    } on ApiException catch (e) {
      _courses[index].grade = previous;
      _error = e.message;
      notifyListeners();
    }
  }

  void calculate() {
    _isCalculated = true;
    notifyListeners();
  }

  /// What semester GPA is needed over the next 30 credits to reach [target].
  ///
  /// Kept client-side: it is a projection over hypothetical future credits, not
  /// a fact about the student's record. `/cgpa/what-if` covers the other case —
  /// projecting specific courses against the real transcript.
  Map<String, dynamic> simulateTargetCgpa(double target) {
    final currentCgpa = _serverCgpa;
    final totalPastCredits = _serverCredits;
    const remainingCredits = 30.0;

    final requiredGpa = ((target * (totalPastCredits + remainingCredits)) -
            (currentCgpa * totalPastCredits)) /
        remainingCredits;

    return {
      'requiredGpa': requiredGpa,
      'achievable': requiredGpa <= 4.0,
      'currentCgpa': currentCgpa,
      'totalPastCredits': totalPastCredits,
      'remainingCredits': remainingCredits,
    };
  }
}
