// todo_list_screen.dart
import 'package:flutter/material.dart';

// ---------------------------------------------------------------------------
// THEME COLORS (Derived from Lab Report Screen)
// ---------------------------------------------------------------------------
class _LabReportThemeColors {
  static const Color scaffoldBackground = Color(0xFFF4F7F6);
  static const Color primary = Color(0xFF407362);
  static const Color textDark = Color(0xFF2C3E35);
  static const Color secondary = Color(0xFFBEEDDC);
  static const Color gradientLight = Color(0xFF8CD4B8);
  static const Color white = Color(0xFFFFFFFF);
  static const Color subtitleGrey = Color(0xFF616161); // Colors.grey.shade700 equivalent
  static const Color success = Color(0xFF2F8F6A); // Retained for state consistency
  static const Color danger = Color(0xFFB5392B); // Retained for state consistency
}

// ---------------------------------------------------------------------------
// MODEL
// ---------------------------------------------------------------------------
enum TaskCategory { today, later }

enum TaskFilter { all, today, later, completed }

class Task {
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

  Task copyWith({
    String? title,
    String? note,
    TaskCategory? category,
    DateTime? dueDate,
    bool clearDueDate = false,
    bool? isDone,
  }) {
    return Task(
      id: id,
      title: title ?? this.title,
      note: note ?? this.note,
      category: category ?? this.category,
      dueDate: clearDueDate ? null : (dueDate ?? this.dueDate),
      isDone: isDone ?? this.isDone,
    );
  }
}

String _formatDate(DateTime dt) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  final hour = dt.hour == 0 ? 12 : (dt.hour > 12 ? dt.hour - 12 : dt.hour);
  final period = dt.hour >= 12 ? 'PM' : 'AM';
  final minute = dt.minute.toString().padLeft(2, '0');
  return '${months[dt.month - 1]} ${dt.day}, $hour:$minute $period';
}

// ---------------------------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------------------------
class TodoListScreen extends StatefulWidget {
  const TodoListScreen({super.key});

  @override
  State<TodoListScreen> createState() => _TodoListScreenState();
}

class _TodoListScreenState extends State<TodoListScreen> {
  final List<Task> _tasks = [];
  TaskFilter _filter = TaskFilter.all;
  int _idCounter = 0;

  String _newId() => 'task_${DateTime.now().microsecondsSinceEpoch}_${_idCounter++}';

  List<Task> get _visibleTasks {
    switch (_filter) {
      case TaskFilter.today:
        return _tasks
            .where((t) => t.category == TaskCategory.today && !t.isDone)
            .toList();
      case TaskFilter.later:
        return _tasks
            .where((t) => t.category == TaskCategory.later && !t.isDone)
            .toList();
      case TaskFilter.completed:
        return _tasks.where((t) => t.isDone).toList();
      case TaskFilter.all:
        return _tasks.where((t) => !t.isDone).toList();
    }
  }

  int get _completedCount => _tasks.where((t) => t.isDone).length;

  void _openTaskForm({Task? existing}) async {
    final result = await showModalBottomSheet<_TaskFormResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _TaskFormSheet(existing: existing),
    );

    if (result == null || !mounted) return;

    if (result.delete && existing != null) {
      _deleteTask(existing.id);
      return;
    }

    setState(() {
      if (existing != null) {
        final index = _tasks.indexWhere((t) => t.id == existing.id);
        if (index != -1) {
          _tasks[index] = existing.copyWith(
            title: result.title,
            note: result.note,
            category: result.category,
            dueDate: result.dueDate,
            clearDueDate: result.dueDate == null,
          );
        }
      } else {
        _tasks.insert(
          0,
          Task(
            id: _newId(),
            title: result.title,
            note: result.note,
            category: result.category,
            dueDate: result.dueDate,
          ),
        );
      }
    });
  }

  void _toggleDone(String id) {
    setState(() {
      final task = _tasks.firstWhere((t) => t.id == id);
      task.isDone = !task.isDone;
    });
  }

  void _deleteTask(String id) {
    setState(() {
      _tasks.removeWhere((t) => t.id == id);
    });
  }

  void _confirmClearAll() {
    if (_tasks.isEmpty) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Clear all tasks?'),
        content: const Text('This will remove every task in your list. This can\'t be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              setState(() => _tasks.clear());
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: _LabReportThemeColors.danger),
            child: const Text('Clear all'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final total = _tasks.length;
    final progress = total == 0 ? 0.0 : _completedCount / total;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [_LabReportThemeColors.scaffoldBackground, _LabReportThemeColors.gradientLight],
            stops: [0.0, 0.7],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(total, progress),
              _buildFilterChips(),
              Expanded(
                child: _visibleTasks.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  itemCount: _visibleTasks.length,
                  itemBuilder: (context, index) {
                    final task = _visibleTasks[index];
                    return _TaskTile(
                      key: ValueKey(task.id),
                      task: task,
                      onToggle: () => _toggleDone(task.id),
                      onDelete: () => _deleteTask(task.id),
                      onTap: () => _openTaskForm(existing: task),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openTaskForm(),
        backgroundColor: _LabReportThemeColors.primary,
        icon: const Icon(Icons.add, color: _LabReportThemeColors.white),
        label: const Text('Add Task', style: TextStyle(color: _LabReportThemeColors.white, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildHeader(int total, double progress) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 16, 12, 20),
      decoration: const BoxDecoration(
        color: _LabReportThemeColors.primary, // Changed to a solid mild green
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'To-Do List',
                style: TextStyle(
                  color: _LabReportThemeColors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                onPressed: _confirmClearAll,
                icon: const Icon(Icons.delete_sweep_outlined, color: _LabReportThemeColors.white),
                tooltip: 'Clear all tasks',
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            total == 0
                ? 'Nothing on your plate yet'
                : '$_completedCount of $total completed',
            style: TextStyle(color: _LabReportThemeColors.white.withValues(alpha: 0.9), fontSize: 14),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
              backgroundColor: _LabReportThemeColors.white.withValues(alpha: 0.3),
              valueColor: const AlwaysStoppedAnimation<Color>(_LabReportThemeColors.secondary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    final options = <TaskFilter, String>{
      TaskFilter.all: 'All',
      TaskFilter.today: 'Today',
      TaskFilter.later: 'Later',
      TaskFilter.completed: 'Completed',
    };

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
      child: SizedBox(
        height: 36,
        child: ListView(
          scrollDirection: Axis.horizontal,
          children: options.entries.map((entry) {
            final selected = _filter == entry.key;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(entry.value),
                selected: selected,
                onSelected: (_) => setState(() => _filter = entry.key),
                selectedColor: _LabReportThemeColors.primary,
                backgroundColor: _LabReportThemeColors.white,
                labelStyle: TextStyle(
                  color: selected ? _LabReportThemeColors.white : _LabReportThemeColors.textDark,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(color: _LabReportThemeColors.primary.withValues(alpha: 0.4)),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    String message;
    switch (_filter) {
      case TaskFilter.today:
        message = 'No tasks for today.\nEnjoy the free time!';
        break;
      case TaskFilter.later:
        message = 'Nothing planned for later yet.';
        break;
      case TaskFilter.completed:
        message = 'No completed tasks yet.\nGet something done!';
        break;
      case TaskFilter.all:
        message = _tasks.isNotEmpty
            ? 'All done! 🎉\nCheck the Completed tab to see them.'
            : 'Your list is empty.\nTap "Add Task" to get started!';
    }
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: _LabReportThemeColors.secondary.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.task_alt, size: 56, color: _LabReportThemeColors.primary),
            ),
            const SizedBox(height: 20),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                color: _LabReportThemeColors.subtitleGrey,
                fontWeight: FontWeight.w500,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// TASK TILE (with swipe-to-delete)
// ---------------------------------------------------------------------------
class _TaskTile extends StatelessWidget {
  final Task task;
  final VoidCallback onToggle;
  final VoidCallback onDelete;
  final VoidCallback onTap;

  const _TaskTile({
    super.key,
    required this.task,
    required this.onToggle,
    required this.onDelete,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isToday = task.category == TaskCategory.today;

    return Dismissible(
      key: ValueKey(task.id),
      direction: DismissDirection.horizontal,
      background: _buildSwipeBackground(Alignment.centerLeft),
      secondaryBackground: _buildSwipeBackground(Alignment.centerRight),
      confirmDismiss: (_) async {
        return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Delete task?'),
            content: Text('Remove "${task.title}" from your list.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                style: TextButton.styleFrom(foregroundColor: _LabReportThemeColors.danger),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ??
            false;
      },
      onDismissed: (_) => onDelete(),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        child: Material(
          color: task.isDone ? _LabReportThemeColors.white.withValues(alpha: 0.6) : _LabReportThemeColors.white,
          borderRadius: BorderRadius.circular(18),
          elevation: 1.5,
          shadowColor: _LabReportThemeColors.primary.withValues(alpha: 0.2),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GestureDetector(
                    onTap: onToggle,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 26,
                      height: 26,
                      margin: const EdgeInsets.only(top: 2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: task.isDone ? _LabReportThemeColors.success : Colors.transparent,
                        border: Border.all(
                          color: task.isDone ? _LabReportThemeColors.success : _LabReportThemeColors.primary,
                          width: 2,
                        ),
                      ),
                      child: task.isDone
                          ? const Icon(Icons.check, size: 16, color: _LabReportThemeColors.white)
                          : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          task.title,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: task.isDone ? _LabReportThemeColors.subtitleGrey : _LabReportThemeColors.textDark,
                            decoration: task.isDone ? TextDecoration.lineThrough : null,
                          ),
                        ),
                        if (task.note.trim().isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            task.note,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 13, color: _LabReportThemeColors.subtitleGrey),
                          ),
                        ],
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            _buildPill(
                              isToday ? 'Today' : 'Later',
                              isToday ? _LabReportThemeColors.success : _LabReportThemeColors.primary,
                            ),
                            if (task.dueDate != null)
                              _buildPill(
                                _formatDate(task.dueDate!),
                                _LabReportThemeColors.success,
                                icon: Icons.schedule,
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: onDelete,
                    icon: const Icon(Icons.delete_outline, color: _LabReportThemeColors.danger, size: 22),
                    splashRadius: 20,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPill(String text, Color color, {IconData? icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(text, style: TextStyle(fontSize: 11.5, color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildSwipeBackground(Alignment alignment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: _LabReportThemeColors.danger.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(18),
      ),
      alignment: alignment,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: const Icon(Icons.delete_outline, color: _LabReportThemeColors.white),
    );
  }
}

// ---------------------------------------------------------------------------
// ADD / EDIT FORM (bottom sheet)
// ---------------------------------------------------------------------------
class _TaskFormResult {
  final String title;
  final String note;
  final TaskCategory category;
  final DateTime? dueDate;
  final bool delete;

  _TaskFormResult({
    required this.title,
    required this.note,
    required this.category,
    required this.dueDate,
    this.delete = false,
  });
}

class _TaskFormSheet extends StatefulWidget {
  final Task? existing;
  const _TaskFormSheet({this.existing});

  @override
  State<_TaskFormSheet> createState() => _TaskFormSheetState();
}

class _TaskFormSheetState extends State<_TaskFormSheet> {
  late final TextEditingController _titleController;
  late final TextEditingController _noteController;
  late TaskCategory _category;
  DateTime? _dueDate;
  String? _errorText;

  bool get _isEditing => widget.existing != null;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.existing?.title ?? '');
    _noteController = TextEditingController(text: widget.existing?.note ?? '');
    _category = widget.existing?.category ?? TaskCategory.today;
    _dueDate = widget.existing?.dueDate;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? now,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365 * 2)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(primary: _LabReportThemeColors.primary),
        ),
        child: child!,
      ),
    );
    if (date == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: _dueDate != null
          ? TimeOfDay.fromDateTime(_dueDate!)
          : TimeOfDay.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(primary: _LabReportThemeColors.primary),
        ),
        child: child!,
      ),
    );
    if (time == null) return;

    setState(() {
      _dueDate = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  void _submit() {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      setState(() => _errorText = 'Please enter a task title');
      return;
    }
    Navigator.pop(
      context,
      _TaskFormResult(
        title: title,
        note: _noteController.text.trim(),
        category: _category,
        dueDate: _dueDate,
      ),
    );
  }

  void _delete() {
    Navigator.pop(
      context,
      _TaskFormResult(title: '', note: '', category: _category, dueDate: null, delete: true),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: _LabReportThemeColors.scaffoldBackground,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(28),
            topRight: Radius.circular(28),
          ),
        ),
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 5,
                  decoration: BoxDecoration(
                    color: _LabReportThemeColors.primary.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                _isEditing ? 'Edit Task' : 'New Task',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: _LabReportThemeColors.textDark,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _titleController,
                autofocus: !_isEditing,
                textCapitalization: TextCapitalization.sentences,
                decoration: InputDecoration(
                  hintText: 'What do you need to do?',
                  errorText: _errorText,
                  filled: true,
                  fillColor: _LabReportThemeColors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                ),
                onChanged: (_) {
                  if (_errorText != null) setState(() => _errorText = null);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _noteController,
                textCapitalization: TextCapitalization.sentences,
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: 'Add a note (optional)',
                  filled: true,
                  fillColor: _LabReportThemeColors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('When?', style: TextStyle(fontWeight: FontWeight.w600, color: _LabReportThemeColors.textDark)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _buildCategoryButton('Today', TaskCategory.today),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildCategoryButton('Later', TaskCategory.later),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: _pickDateTime,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: _LabReportThemeColors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined, size: 18, color: _LabReportThemeColors.primary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _dueDate == null ? 'Set a due date & time (optional)' : _formatDate(_dueDate!),
                          style: const TextStyle(color: _LabReportThemeColors.textDark, fontWeight: FontWeight.w500),
                        ),
                      ),
                      if (_dueDate != null)
                        GestureDetector(
                          onTap: () => setState(() => _dueDate = null),
                          child: const Icon(Icons.close, size: 18, color: _LabReportThemeColors.subtitleGrey),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 22),
              Row(
                children: [
                  if (_isEditing)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _delete,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: _LabReportThemeColors.danger,
                          side: const BorderSide(color: _LabReportThemeColors.danger),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Text('Delete'),
                      ),
                    ),
                  if (_isEditing) const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _LabReportThemeColors.primary,
                        foregroundColor: _LabReportThemeColors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(_isEditing ? 'Save Changes' : 'Add Task'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryButton(String label, TaskCategory value) {
    final selected = _category == value;
    return GestureDetector(
      onTap: () => setState(() => _category = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? _LabReportThemeColors.primary : _LabReportThemeColors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _LabReportThemeColors.primary.withValues(alpha: 0.4)),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: selected ? _LabReportThemeColors.white : _LabReportThemeColors.textDark,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}