import { useMemo, useState } from 'react';
import type { Task, TaskCategory, TaskFilter } from '../models/task';

// Mirrors _TodoListScreenState in lib/screens/todo_list_screen.dart
export function useTodoListViewModel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const idCounter = useMemo(() => ({ n: 0 }), []);

  function newId() {
    return `task_${Date.now()}_${idCounter.n++}`;
  }

  const visibleTasks = useMemo(() => {
    switch (filter) {
      case 'today':
        return tasks.filter((t) => t.category === 'today' && !t.isDone);
      case 'later':
        return tasks.filter((t) => t.category === 'later' && !t.isDone);
      case 'completed':
        return tasks.filter((t) => t.isDone);
      case 'all':
        return tasks.filter((t) => !t.isDone);
    }
  }, [tasks, filter]);

  const completedCount = tasks.filter((t) => t.isDone).length;
  const total = tasks.length;
  const progress = total === 0 ? 0 : completedCount / total;

  function openNewForm() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEditForm(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingTask(null);
  }

  function saveForm(result: {
    title: string;
    note: string;
    category: TaskCategory;
    dueDate?: Date;
    delete: boolean;
  }) {
    if (result.delete && editingTask) {
      setTasks((prev) => prev.filter((t) => t.id !== editingTask.id));
      closeForm();
      return;
    }
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? { ...t, title: result.title, note: result.note, category: result.category, dueDate: result.dueDate }
            : t,
        ),
      );
    } else {
      setTasks((prev) => [
        { id: newId(), title: result.title, note: result.note, category: result.category, dueDate: result.dueDate, isDone: false },
        ...prev,
      ]);
    }
    closeForm();
  }

  function toggleDone(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t)));
  }

  function requestDelete(task: Task) {
    setConfirmDelete(task);
  }

  function confirmDeleteTask() {
    if (confirmDelete) {
      setTasks((prev) => prev.filter((t) => t.id !== confirmDelete.id));
    }
    setConfirmDelete(null);
  }

  function cancelDelete() {
    setConfirmDelete(null);
  }

  function requestClearAll() {
    if (tasks.length > 0) setConfirmClear(true);
  }

  function confirmClearAll() {
    setTasks([]);
    setConfirmClear(false);
  }

  function cancelClear() {
    setConfirmClear(false);
  }

  return {
    tasks,
    visibleTasks,
    filter,
    setFilter,
    completedCount,
    total,
    progress,
    formOpen,
    editingTask,
    confirmClear,
    confirmDelete,
    openNewForm,
    openEditForm,
    closeForm,
    saveForm,
    toggleDone,
    requestDelete,
    confirmDeleteTask,
    cancelDelete,
    requestClearAll,
    confirmClearAll,
    cancelClear,
  };
}
