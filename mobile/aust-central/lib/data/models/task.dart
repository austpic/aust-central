/// A to-do item.
enum TaskCategory {
  today,
  later;

  /// Wire value the API expects.
  String get apiValue => this == TaskCategory.later ? 'LATER' : 'TODAY';

  static TaskCategory fromApi(String? raw) =>
      raw == 'LATER' ? TaskCategory.later : TaskCategory.today;
}

/// The tabs on the to-do screen.
enum TaskFilter { all, today, later, completed }

class Task {
  /// Server-assigned. Client-generated ids would not exist anywhere but the
  /// widget that made them.
  final String id;
  String title;
  String note;
  TaskCategory category;
  DateTime? dueDate;
  bool isDone;

  Task({
    required this.id,
    required this.title,
    this.note = '',
    this.category = TaskCategory.today,
    this.dueDate,
    this.isDone = false,
  });

  factory Task.fromJson(Map<String, dynamic> json) => Task(
        id: json['id'] as String,
        title: json['title'] as String,
        note: json['note'] as String? ?? '',
        category: TaskCategory.fromApi(json['category'] as String?),
        dueDate: json['dueDate'] == null
            ? null
            : DateTime.parse(json['dueDate'] as String).toLocal(),
        isDone: json['isDone'] as bool? ?? false,
      );

  Task copyWith({
    String? title,
    String? note,
    TaskCategory? category,
    DateTime? dueDate,
    bool clearDueDate = false,
    bool? isDone,
  }) =>
      Task(
        id: id,
        title: title ?? this.title,
        note: note ?? this.note,
        category: category ?? this.category,
        dueDate: clearDueDate ? null : (dueDate ?? this.dueDate),
        isDone: isDone ?? this.isDone,
      );
}
