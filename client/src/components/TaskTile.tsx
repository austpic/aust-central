import { Check, Trash2 } from 'lucide-react';
import type { Task } from '../models/task';
import { formatTaskDate } from '../models/task';

// Mirrors _TaskTile in lib/screens/todo_list_screen.dart, rendered with the
// v7 list-item anatomy: leading checkbox + tinted mono meta chip.
export default function TaskTile({
  task,
  onToggle,
  onDelete,
  onTap,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onTap: () => void;
}) {
  const isToday = task.category === 'today';

  return (
    <div className={`glass flex items-center gap-3 rounded-[20px] p-3.5 ${task.isDone ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle task"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[7px] border-[1.6px] transition-all duration-150 ${
          task.isDone
            ? 'border-mint-ink bg-mint shadow-[0_0_10px_rgba(110,242,165,0.4)]'
            : 'border-glass-rim bg-white/40'
        }`}
      >
        <Check
          size={12}
          strokeWidth={3.2}
          className={`text-[#0a1713] transition-opacity duration-150 ${task.isDone ? 'opacity-100' : 'opacity-0'}`}
        />
      </button>
      <button type="button" onClick={onTap} className="min-w-0 flex-1 text-left">
        <div
          className={`text-[14px] font-medium transition-all duration-150 ${
            task.isDone ? 'text-dim2 line-through' : 'text-textdark'
          }`}
        >
          {task.title}
        </div>
        {task.note.trim() && (
          <div className="mt-0.5 line-clamp-2 text-[12.5px] text-dim">{task.note}</div>
        )}
      </button>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em] ${
            isToday ? 'tag-coral' : 'tag-sky'
          }`}
        >
          {isToday ? 'Today' : 'Later'}
        </span>
        {task.dueDate && (
          <span className="rounded-full bg-white/50 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-dim">
            {formatTaskDate(task.dueDate)}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete task"
        className="shrink-0 rounded-full p-2 text-danger/70 hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}
