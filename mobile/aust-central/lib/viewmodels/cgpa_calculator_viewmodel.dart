import 'package:flutter/foundation.dart';
import '../models/course_grade_model.dart';

class CGPACalculatorViewModel extends ChangeNotifier {
  final List<CourseGradeModel> _courses = [
    CourseGradeModel(courseName: 'Data Structures', credits: 3.0, grade: 'A'),
    CourseGradeModel(courseName: 'Database Systems', credits: 3.0, grade: 'A'),
    CourseGradeModel(courseName: 'Digital Logic Design', credits: 3.0, grade: 'A'),
    CourseGradeModel(courseName: 'Discrete Mathematics', credits: 3.0, grade: 'A'),
    CourseGradeModel(courseName: 'English Composition', credits: 3.0, grade: 'A'),
    CourseGradeModel(courseName: 'Physics Lab', credits: 1.5, grade: 'A'),
  ];

  final List<SemesterRecord> _semesterHistory = const [
    SemesterRecord(
      semesterName: 'Spring 2023',
      semesterGpa: 3.85,
      cumulativeCgpa: 3.85,
      totalCredits: 18,
    ),
    SemesterRecord(
      semesterName: 'Summer 2023',
      semesterGpa: 3.72,
      cumulativeCgpa: 3.78,
      totalCredits: 15,
    ),
    SemesterRecord(
      semesterName: 'Fall 2023',
      semesterGpa: 3.90,
      cumulativeCgpa: 3.82,
      totalCredits: 18,
    ),
    SemesterRecord(
      semesterName: 'Spring 2024',
      semesterGpa: 3.65,
      cumulativeCgpa: 3.78,
      totalCredits: 16,
    ),
    SemesterRecord(
      semesterName: 'Summer 2024',
      semesterGpa: 3.50,
      cumulativeCgpa: 3.72,
      totalCredits: 12,
    ),
  ];

  bool _isCalculated = false;

  List<CourseGradeModel> get courses => _courses;
  List<SemesterRecord> get semesterHistory => _semesterHistory;
  bool get isCalculated => _isCalculated;

  double get semesterGpa {
    double totalPoints = 0;
    double totalCredits = 0;
    for (final course in _courses) {
      totalPoints += course.gradePoint * course.credits;
      totalCredits += course.credits;
    }
    if (totalCredits == 0) return 0.0;
    return totalPoints / totalCredits;
  }

  double get cumulativeCgpa {
    if (_semesterHistory.isEmpty) return semesterGpa;
    double totalPoints = 0;
    double totalCredits = 0;
    for (final record in _semesterHistory) {
      totalPoints += record.semesterGpa * record.totalCredits;
      totalCredits += record.totalCredits;
    }
    double currentCredits = 0;
    for (final course in _courses) {
      currentCredits += course.credits;
    }
    totalPoints += semesterGpa * currentCredits;
    totalCredits += currentCredits;
    if (totalCredits == 0) return 0.0;
    return totalPoints / totalCredits;
  }

  double get totalCurrentCredits {
    double total = 0;
    for (final course in _courses) {
      total += course.credits;
    }
    return total;
  }

  void updateGrade(int index, String newGrade) {
    _courses[index].grade = newGrade;
    _isCalculated = false;
    notifyListeners();
  }

  void calculate() {
    _isCalculated = true;
    notifyListeners();
  }

  Map<String, dynamic> simulateTargetCgpa(double target) {
    final double currentCgpa = cumulativeCgpa;
    double totalPastCredits = 0;
    for (final record in _semesterHistory) {
      totalPastCredits += record.totalCredits;
    }
    totalPastCredits += totalCurrentCredits;

    final double remainingCredits = 30;
    final double requiredGpa =
        ((target * (totalPastCredits + remainingCredits)) -
            (currentCgpa * totalPastCredits)) /
        remainingCredits;

    return {
      'currentCgpa': currentCgpa,
      'targetCgpa': target,
      'completedCredits': totalPastCredits,
      'remainingCredits': remainingCredits,
      'requiredGpa': requiredGpa.clamp(0.0, 4.0),
      'isAchievable': requiredGpa <= 4.0 && requiredGpa >= 0.0,
      'message': requiredGpa <= 4.0 && requiredGpa >= 0.0
          ? 'You need a GPA of ${requiredGpa.clamp(0.0, 4.0).toStringAsFixed(2)} in your remaining ${remainingCredits.toInt()} credits to achieve a CGPA of ${target.toStringAsFixed(2)}.'
          : 'Unfortunately, a CGPA of ${target.toStringAsFixed(2)} is not achievable with ${remainingCredits.toInt()} remaining credits.',
    };
  }
}