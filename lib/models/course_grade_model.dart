class CourseGradeModel {
  final String courseName;
  final double credits;
  String grade;

  CourseGradeModel({
    required this.courseName,
    required this.credits,
    this.grade = 'A',
  });

  double get gradePoint {
    switch (grade) {
      case 'A+':
        return 4.00;
      case 'A':
        return 3.75;
      case 'A-':
        return 3.50;
      case 'B+':
        return 3.25;
      case 'B':
        return 3.00;
      case 'B-':
        return 2.75;
      case 'C':
        return 2.50;
      case 'D':
        return 2.00;
      case 'F':
        return 0.00;
      default:
        return 0.00;
    }
  }
}

class SemesterRecord {
  final String semesterName;
  final double semesterGpa;
  final double cumulativeCgpa;
  final int totalCredits;

  const SemesterRecord({
    required this.semesterName,
    required this.semesterGpa,
    required this.cumulativeCgpa,
    required this.totalCredits,
  });
}