class ClassReminderModel {
  final String courseName;
  bool isEnabled;
  int minutesBefore;

  ClassReminderModel({
    required this.courseName,
    this.isEnabled = true,
    this.minutesBefore = 10,
  });
}