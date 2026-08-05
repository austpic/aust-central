class ClassReminderModel {
  final String courseName;
  final String weekday;
  final String classTime;
  bool isEnabled;
  int minutesBefore;

  ClassReminderModel({
    required this.courseName,
    required this.weekday,
    required this.classTime,
    this.isEnabled = true,
    this.minutesBefore = 10,
  });
}