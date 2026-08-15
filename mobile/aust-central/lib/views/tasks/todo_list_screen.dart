// todo_list_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:aust_track/data/models/task.dart';
import 'package:aust_track/theme/app_colors.dart';
import 'package:aust_track/data/repositories/academic_repository.dart';
import 'package:aust_track/viewmodels/task_list_view_model.dart';
import 'package:aust_track/views/widgets/async_views.dart';

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
// VIEW
// ---------------------------------------------------------------------------

/// To-do list screen.
///
/// A passive view: it holds no task state and performs no I/O. Everything it
/// renders comes from [TaskListViewModel], and every interaction is dispatched
/// back to it. The only local state left is the form sheet's own text fields.
class TodoListScreen extends StatelessWidget {
  const TodoListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => TaskListViewModel(context.read<AcademicRepository>()),
      child: const _TodoListView(),
    );
  }
}

class _TodoListView extends StatelessWidget {
  const _TodoListView();

  /// Surface a failed write.
  ///
  /// Takes the messenger rather than a BuildContext: the caller captures it
  /// *before* awaiting, so there is no context held across an async gap and
  /// nothing to go stale if the user navigates away mid-request.
  void _report(ScaffoldMessengerState messenger, String? failure) {
    if (failure == null) return;
    messenger.showSnackBar(
      SnackBar(content: Text(failure), behavior: SnackBarBehavior.floating),
    );
  }

  Future<void> _openTaskForm(BuildContext context, {Task? existing}) async {
    final viewModel = context.read<TaskListViewModel>();
    final messenger = ScaffoldMessenger.of(context);

    final result = await showModalBottomSheet<_TaskFormResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _TaskFormSheet(existing: existing),
    );
    if (result == null) return;

    if (result.delete && existing != null) {
      _report(messenger, await viewModel.deleteTask(existing.id));
      return;
    }

    _report(
      messenger,
      existing == null
          ? await viewModel.createTask(
              title: result.title,
              note: result.note,
              category: result.category,
              dueDate: result.dueDate,
            )
          : await viewModel.updateTask(
              existing,
              title: result.title,
              note: result.note,
              category: result.category,
              dueDate: result.dueDate,
            ),
    );
  }

  Future<void> _confirmClearAll(BuildContext context) async {
    final viewModel = context.read<TaskListViewModel>();
    final messenger = ScaffoldMessenger.of(context);
    if (viewModel.totalCount == 0) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Clear all tasks?'),
        content: const Text(
            "This will remove every task in your list. This can't be undone."),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: TextButton.styleFrom(
                foregroundColor: AppColors.danger),
            child: const Text('Clear all'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    _report(messenger, await viewModel.clearAll());
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<TaskListViewModel>();
    final visible = viewModel.visibleTasks;
    final total = viewModel.totalCount;
    final progress = total == 0 ? 0.0 : viewModel.completedCount / total;

    return Scaffold(
      backgroundColor: CgpaColors.white,
      appBar: AppBar(
        backgroundColor: CgpaColors.white,
        foregroundColor: CgpaColors.headingDark,
        elevation: 0,
        title: const Text('To-do List',
            style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            tooltip: 'Clear all',
            icon: const Icon(Icons.delete_sweep_outlined),
            onPressed: () => _confirmClearAll(context),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            _Header(
              completed: viewModel.completedCount,
              total: total,
              progress: progress,
            ),
            _FilterChips(
              selected: viewModel.filter,
              onSelected: viewModel.setFilter,
            ),
            Expanded(
              child: AsyncContent(
                loading: viewModel.isBusy,
                error: viewModel.errorMessage,
                isEmpty: visible.isEmpty,
                onRetry: () => viewModel.load(silent: true),
                emptyView: _EmptyTasks(filter: viewModel.filter),
                builder: () => ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  itemCount: visible.length,
                  itemBuilder: (itemContext, index) {
                    final task = visible[index];
                    final messenger = ScaffoldMessenger.of(itemContext);
                    return _TaskTile(
                      key: ValueKey(task.id),
                      task: task,
                      onToggle: () async =>
                          _report(messenger, await viewModel.toggleDone(task.id)),
                      onDelete: () async =>
                          _report(messenger, await viewModel.deleteTask(task.id)),
                      onTap: () => _openTaskForm(itemContext, existing: task),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: CgpaColors.primary,
        foregroundColor: Colors.white,
        onPressed: () => _openTaskForm(context),
        icon: const Icon(Icons.add),
        label: const Text('New task'),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final int completed;
  final int total;
  final double progress;

  const _Header({
    required this.completed,
    required this.total,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            CgpaColors.primary,
            CgpaColors.gradientLight,
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            total == 0 ? 'Nothing to do yet' : '$completed of $total completed',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: Colors.white24,
              valueColor: const AlwaysStoppedAnimation<Color>(
                  CgpaColors.lightAccent),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChips extends StatelessWidget {
  final TaskFilter selected;
  final ValueChanged<TaskFilter> onSelected;

  const _FilterChips({required this.selected, required this.onSelected});

  static const _labels = <TaskFilter, String>{
    TaskFilter.all: 'All',
    TaskFilter.today: 'Today',
    TaskFilter.later: 'Later',
    TaskFilter.completed: 'Completed',
  };

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
      child: SizedBox(
        height: 36,
        child: ListView(
          scrollDirection: Axis.horizontal,
          children: _labels.entries.map((entry) {
            final isSelected = selected == entry.key;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(entry.value),
                selected: isSelected,
                onSelected: (_) => onSelected(entry.key),
                selectedColor: CgpaColors.lightAccent,
                backgroundColor: Colors.white,
                labelStyle: TextStyle(
                  color: isSelected
                      ? CgpaColors.primary
                      : CgpaColors.headingDark,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _EmptyTasks extends StatelessWidget {
  final TaskFilter filter;
  const _EmptyTasks({required this.filter});

  @override
  Widget build(BuildContext context) {
    final message = switch (filter) {
      TaskFilter.completed => 'Nothing completed yet',
      TaskFilter.today => 'Nothing due today',
      TaskFilter.later => 'Nothing scheduled for later',
      TaskFilter.all => 'Your list is empty — add your first task',
    };

    return EmptyView(icon: Icons.checklist_rtl, message: message);
  }
}

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
                style: TextButton.styleFrom(foregroundColor: AppColors.danger),
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
          color: task.isDone ? CgpaColors.white.withValues(alpha: 0.6) : CgpaColors.white,
          borderRadius: BorderRadius.circular(18),
          elevation: 1.5,
          shadowColor: CgpaColors.primary.withValues(alpha: 0.2),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GestureDetector(
                    key: ValueKey('task-toggle-${task.id}'),
                    onTap: onToggle,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 26,
                      height: 26,
                      margin: const EdgeInsets.only(top: 2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: task.isDone ? AppColors.success : Colors.transparent,
                        border: Border.all(
                          color: task.isDone ? AppColors.success : CgpaColors.primary,
                          width: 2,
                        ),
                      ),
                      child: task.isDone
                          ? const Icon(Icons.check, size: 16, color: CgpaColors.white)
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
                            color: task.isDone ? CgpaColors.subtitleGrey : CgpaColors.headingDark,
                            decoration: task.isDone ? TextDecoration.lineThrough : null,
                          ),
                        ),
                        if (task.note.trim().isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            task.note,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 13, color: CgpaColors.subtitleGrey),
                          ),
                        ],
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            _buildPill(
                              isToday ? 'Today' : 'Later',
                              isToday ? AppColors.success : CgpaColors.primary,
                            ),
                            if (task.dueDate != null)
                              _buildPill(
                                _formatDate(task.dueDate!),
                                AppColors.success,
                                icon: Icons.schedule,
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: onDelete,
                    icon: const Icon(Icons.delete_outline, color: AppColors.danger, size: 22),
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
        color: AppColors.danger.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(18),
      ),
      alignment: alignment,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: const Icon(Icons.delete_outline, color: CgpaColors.white),
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
          colorScheme: const ColorScheme.light(primary: CgpaColors.primary),
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
          colorScheme: const ColorScheme.light(primary: CgpaColors.primary),
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
          color: AppColors.sheetBackground, // Bottom sheet background updated to 0xFFEBEBEB
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
                    color: CgpaColors.subtitleGrey.withValues(alpha: 0.4),
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
                  color: CgpaColors.headingDark, // Adjusted text color for contrast
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
                  fillColor: CgpaColors.white,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.subtitleGrey, width: 1.5), // Card outline set to 0xFF6B8578
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.subtitleGrey, width: 2.0), // Focused outline set to 0xFF6B8578
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
                  fillColor: CgpaColors.white,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.subtitleGrey, width: 1.5), // Card outline set to 0xFF6B8578
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.subtitleGrey, width: 2.0), // Focused outline set to 0xFF6B8578
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('When?', style: TextStyle(fontWeight: FontWeight.w600, color: CgpaColors.headingDark)),
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
                    color: CgpaColors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.subtitleGrey, width: 1.5), // Card outline set to 0xFF6B8578
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined, size: 18, color: CgpaColors.primary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _dueDate == null ? 'Set a due date & time (optional)' : _formatDate(_dueDate!),
                          style: const TextStyle(color: CgpaColors.headingDark, fontWeight: FontWeight.w500),
                        ),
                      ),
                      if (_dueDate != null)
                        GestureDetector(
                          onTap: () => setState(() => _dueDate = null),
                          child: const Icon(Icons.close, size: 18, color: CgpaColors.subtitleGrey),
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
                          foregroundColor: AppColors.danger,
                          side: const BorderSide(color: AppColors.danger),
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
                        backgroundColor: CgpaColors.primary,
                        foregroundColor: CgpaColors.white,
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
          color: selected ? CgpaColors.primary : CgpaColors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.subtitleGrey, width: 1.5), // Category button outline set to 0xFF6B8578
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: selected ? CgpaColors.white : CgpaColors.headingDark,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}