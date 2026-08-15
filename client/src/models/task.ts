// Mirrors the Task model defined inside lib/screens/todo_list_screen.dart
export type TaskCategory = 'today' | 'later';

export type TaskFilter = 'all' | 'today' | 'later' | 'completed';

export interface Task {
  id: string;
  title: string;
  note: string;
  category: TaskCategory;
  dueDate?: Date;
  isDone: boolean;
}

export interface TaskFormResult {
  title: string;
  note: string;
  category: TaskCategory;
  dueDate?: Date;
  delete: boolean;
}

// Format helper matching _formatDate in todo_list_screen.dart
export function formatTaskDate(dt: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const hour = dt.getHours() === 0 ? 12 : (dt.getHours() > 12 ? dt.getHours() - 12 : dt.getHours());
  const period = dt.getHours() >= 12 ? 'PM' : 'AM';
  const minute = dt.getMinutes().toString().padStart(2, '0');
  return `${months[dt.getMonth()]} ${dt.getDate()}, ${hour}:${minute} ${period}`;
}
