enum AssessmentType { quiz, mid, lab }

extension AssessmentTypeLabel on AssessmentType {
  String get label {
    switch (this) {
      case AssessmentType.quiz:
        return 'Quiz';
      case AssessmentType.mid:
        return 'Mid';
      case AssessmentType.lab:
        return 'Lab Mid';
    }
  }
}

class AssessmentReminder {
  final AssessmentType type;
  final DateTime dateTime;

  AssessmentReminder({
    required this.type,
    required this.dateTime,
  });
}

class ClassReminderModel {
  final String courseName;
  final String weekday;
  final String classTime;
  bool isEnabled;
  int minutesBefore;
  final List<AssessmentReminder> assessments;

  ClassReminderModel({
    required this.courseName,
    required this.weekday,
    required this.classTime,
    this.isEnabled = true,
    this.minutesBefore = 10,
    List<AssessmentReminder>? assessments,
  }) : assessments = assessments ?? [];
}