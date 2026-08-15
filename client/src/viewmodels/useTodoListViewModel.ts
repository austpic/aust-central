import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Task, TaskCategory, TaskFilter } from '../models/task';
import { academicRepository } from '../repositories/academic';
import { ApiError } from '../api/errors';

// Mirrors _TodoListScreenState in lib/views/tasks/todo_list_screen.dart —
// server-backed now. Tasks used to live only in this hook's React state, so
// they vanished on every reload; they now persist per user.

function toApiCategory(category: TaskCategory): string {
  return category === 'later' ? 'LATER' : 'TODAY';
}

function fromJson(json: Record<string, unknown>): Task {
  return {
    id: json.id as string,
    title: json.title as string,
    note: (json.note as string) ?? '',
    category: json.category === 'LATER' ? 'later' : 'today',
    dueDate: json.dueDate ? new Date(json.dueDate as string) : undefined,
    isDone: Boolean(json.isDone),
  };
}

export function useTodoListViewModel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await academicRepository.listTasks();
      setTasks(items.map(fromJson));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  async function saveForm(result: {
    title: string;
    note: string;
    category: TaskCategory;
    dueDate?: Date;
    delete: boolean;
  }) {
    try {
      if (result.delete && editingTask) {
        await academicRepository.deleteTask(editingTask.id);
        setTasks((prev) => prev.filter((t) => t.id !== editingTask.id));
        closeForm();
        return;
      }
      if (editingTask) {
        const updated = await academicRepository.updateTask(editingTask.id, {
          title: result.title,
          note: result.note,
          category: toApiCategory(result.category),
          dueDate: result.dueDate ? result.dueDate.toISOString() : null,
        });
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? fromJson(updated) : t)));
      } else {
        // The id is server-assigned, so the local list and the database agree
        // — the previous `task_<millis>` id existed nowhere but this hook.
        const created = await academicRepository.createTask({
          title: result.title,
          note: result.note,
          category: toApiCategory(result.category),
          dueDate: result.dueDate?.toISOString(),
        });
        setTasks((prev) => [fromJson(created), ...prev]);
      }
      closeForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the task.');
    }
  }

  async function toggleDone(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const next = !task.isDone;

    // Optimistic: flip immediately, roll back if the write fails.
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isDone: next } : t)));
    try {
      await academicRepository.updateTask(id, { isDone: next });
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isDone: !next } : t)));
      setError(err instanceof ApiError ? err.message : 'Could not update the task.');
    }
  }

  function requestDelete(task: Task) {
    setConfirmDelete(task);
  }

  async function confirmDeleteTask() {
    if (confirmDelete) {
      const id = confirmDelete.id;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await academicRepository.deleteTask(id);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not delete the task.');
        await load();
      }
    }
    setConfirmDelete(null);
  }

  function cancelDelete() {
    setConfirmDelete(null);
  }

  function requestClearAll() {
    if (tasks.length > 0) setConfirmClear(true);
  }

  async function confirmClearAll() {
    const doomed = tasks;
    setTasks([]);
    setConfirmClear(false);
    try {
      // No bulk-delete endpoint: deleting individually keeps the server's
      // per-row ownership check on every one of them.
      await Promise.all(doomed.map((t) => academicRepository.deleteTask(t.id)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not clear all tasks.');
      await load();
    }
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
    loading,
    error,
    reload: load,
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
