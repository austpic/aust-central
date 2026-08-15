import { useState } from 'react';
import { ArrowLeft, Check, Trash2, Clock, CalendarDays, Plus, X } from 'lucide-react';
import TaskTile from '../components/TaskTile';
import ProgressRing from '../components/ProgressRing';
import TaskCalendar from '../components/TaskCalendar';
import { Dialog, ConfirmDialog } from '../components/Modal';
import Field from '../components/Field';
import { useTodoListViewModel } from '../viewmodels/useTodoListViewModel';
import type { TaskCategory, Task } from '../models/task';
import { formatTaskDate } from '../models/task';
import { LoadingState, ErrorState } from '../components/AsyncState';

const FILTERS: { key: 'all' | 'today' | 'later' | 'completed'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'later', label: 'Later' },
  { key: 'completed', label: 'Completed' },
];

// Mirrors the todo_list_screen.dart header + filter chips + list + FAB.
// v7: mono header + mini gradient completion ring + mint FAB.
export default function TodoListView() {
  const vm = useTodoListViewModel();

  const emptyMessage = (() => {
    switch (vm.filter) {
      case 'today':
        return 'Nothing due today.\nEnjoy the free time!';
      case 'later':
        return 'No later tasks yet.\nPlan something fun or useful.';
      case 'completed':
        return 'Nothing completed yet.\nKnock one out and celebrate!';
      case 'all':
        return vm.tasks.length > 0
          ? 'All done! 🎉\nHead to Completed to relive your wins.'
          : 'A fresh slate.\nTap "Add Task" and start with something small.';
    }
  })();

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header — back + title + clear all */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => history.back()}
          aria-label="Back"
          className="glass flex h-11 w-11 items-center justify-center rounded-[12px] text-mint-ink transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-display text-[22px] font-bold tracking-tight text-textdark">
          Today's Tasks
        </span>
        <button
          type="button"
          onClick={vm.requestClearAll}
          aria-label="Clear all tasks"
          className="rounded-[12px] px-2 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-dim transition-colors hover:text-danger"
        >
          Clear all
        </button>
      </div>

      {/* Mini completion ring */}
      <div className="mt-5 flex items-center gap-4">
        <ProgressRing
          size={56}
          strokeWidth={6}
          progress={vm.progress}
          colors={['#407362', '#8cd4b8']}
        >
          <span className="font-mono text-[11px] font-bold text-mint-ink">
            {vm.completedCount}/{vm.total}
          </span>
        </ProgressRing>
        <div className="text-[12.5px] leading-snug text-dim">
          <b className="font-display text-[15px] font-bold text-textdark">
            {vm.total === 0 ? '0% complete' : `${Math.round(vm.progress * 100)}% complete`}
          </b>
          <br />
          <span className="font-mono text-[10px] uppercase tracking-[0.08em]">
            {vm.total === 0 ? 'Nothing on your plate yet' : 'Keep the streak going'}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex gap-2 overflow-x-auto py-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => vm.setFilter(f.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
              vm.filter === f.key
                ? 'glass-pill-active'
                : 'glass-pill text-textdark'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {vm.loading ? (
        <LoadingState />
      ) : vm.error ? (
        <ErrorState message={vm.error} onRetry={vm.reload} />
      ) : vm.visibleTasks.length === 0 ? (
        <div className="flex flex-col items-center px-8 py-12 text-center">
          <div className="glass-tint flex h-20 w-20 items-center justify-center rounded-full">
            <Check size={40} className="text-mint-ink" />
          </div>
          <div className="mt-4 whitespace-pre-line text-[15px] font-medium leading-[1.4] text-dim">
            {emptyMessage}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {vm.visibleTasks.map((task) => (
            <TaskTile
              key={task.id}
              task={task}
              onToggle={() => vm.toggleDone(task.id)}
              onDelete={() => vm.requestDelete(task)}
              onTap={() => vm.openEditForm(task)}
            />
          ))}
        </div>
      )}

      {/* Add task FAB — mint gradient, bottom-right, above the nav bar */}
      <button
        type="button"
        onClick={vm.openNewForm}
        aria-label="Add task"
        className="fab fixed bottom-24 right-6 z-30 h-[50px] w-[50px]"
      >
        <Plus size={22} strokeWidth={2.8} />
      </button>

      {/* Form sheet */}
      {vm.formOpen && (
        <TaskFormSheet
          task={vm.editingTask}
          onClose={vm.closeForm}
          onSave={vm.saveForm}
        />
      )}

      {/* Delete confirm */}
      {vm.confirmDelete && (
        <ConfirmDialog
          title="Delete task?"
          message={`Remove "${vm.confirmDelete.title}" from your list.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={vm.confirmDeleteTask}
          onCancel={vm.cancelDelete}
        />
      )}

      {/* Clear-all confirm */}
      {vm.confirmClear && (
        <ConfirmDialog
          title="Clear all tasks?"
          message="This will remove every task in your list. This can't be undone."
          confirmLabel="Clear all"
          cancelLabel="Cancel"
          danger
          onConfirm={vm.confirmClearAll}
          onCancel={vm.cancelClear}
        />
      )}
    </div>
  );
}

// Mirrors _TaskFormSheet in todo_list_screen.dart (bottom-sheet form). The
// deadline is optional: pick a day on the calendar, optionally set a time,
// or leave it empty and save without one.
function TaskFormSheet({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (result: {
    title: string;
    note: string;
    category: TaskCategory;
    dueDate?: Date;
    delete: boolean;
  }) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  const [category, setCategory] = useState<TaskCategory>(task?.category ?? 'today');
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate);
  const [timeValue, setTimeValue] = useState<string>(() =>
    task?.dueDate ? toTimeString(task.dueDate) : '',
  );
  const [calMonth, setCalMonth] = useState<Date>(() => {
    const base = task?.dueDate ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const isEditing = task !== null;

  function submit() {
    const trimmed = title.trim();
    if (trimmed === '') {
      setErrorText('Please enter a task title');
      return;
    }
    onSave({ title: trimmed, note: note.trim(), category, dueDate, delete: false });
  }

  function pickDate(date: Date) {
    const base = dueDate ?? new Date();
    const h = timeValue ? parseInt(timeValue.split(':')[0], 10) : base.getHours();
    const m = timeValue ? parseInt(timeValue.split(':')[1], 10) : base.getMinutes();
    setDueDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0));
    setTimeValue(`${pad2(h)}:${pad2(m)}`);
  }

  function onTimeChange(value: string) {
    setTimeValue(value);
    if (dueDate && value.length === 5) {
      const [h, m] = value.split(':').map(Number);
      const d = new Date(dueDate);
      d.setHours(h, m, 0, 0);
      setDueDate(d);
    }
  }

  function removeDeadline() {
    setDueDate(undefined);
    setTimeValue('');
  }

  return (
    <Dialog title={isEditing ? 'Edit Task' : 'New Task'} onClose={onClose}>
      <div>
        <Field
          label="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errorText) setErrorText(null);
          }}
          placeholder="What do you need to do?"
          autoFocus
        />
        {errorText && <div className="mt-1 text-xs text-danger">{errorText}</div>}
        <div className="h-3" />
        <Field
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          textarea
          rows={2}
        />
        <div className="eyebrow-rule mt-4">When?</div>
        <div className="mt-3 flex gap-3">
          {(['today', 'later'] as TaskCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`flex-1 rounded-[14px] py-3 font-semibold transition-all duration-200 ${
                category === c ? 'glass-pill-active' : 'glass-tint text-textdark'
              }`}
            >
              {c === 'today' ? 'Today' : 'Later'}
            </button>
          ))}
        </div>

        {/* Deadline — optional. Collapsed box by default; tap to open the
            calendar + time picker, then "Done" collapses back to a summary. */}
        <div className="eyebrow-rule mt-5">Deadline</div>
        <div className="mt-3">
          {deadlineOpen ? (
            <div>
              <TaskCalendar
                viewDate={calMonth}
                selectedDate={dueDate ?? null}
                onSelect={pickDate}
                onPrevMonth={() => setCalMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                onNextMonth={() => setCalMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                onToday={() => {
                  const now = new Date();
                  setCalMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  pickDate(now);
                }}
              />
              <div className="mt-3">
                <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-dim">
                  Time
                </span>
                <span className="glass-input flex items-center gap-3 rounded-[14px] px-4 py-3">
                  <Clock size={18} className="shrink-0 text-mint-ink" />
                  <input
                    type="time"
                    value={timeValue}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-full bg-transparent text-[14px] text-textdark outline-none"
                  />
                </span>
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeadlineOpen(false)}
                  className="glass-accent flex flex-1 items-center justify-center gap-2 rounded-[14px] py-3 font-semibold text-white"
                >
                  <Check size={16} />
                  Done
                </button>
                {dueDate && (
                  <button
                    type="button"
                    onClick={removeDeadline}
                    className="flex items-center gap-1.5 rounded-[14px] border border-glass-border px-4 text-[13px] font-semibold text-dim transition-colors hover:text-danger"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setDeadlineOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setDeadlineOpen(true);
              }}
              className="glass-input flex w-full cursor-pointer items-center gap-3 rounded-[14px] px-4 py-3 text-left"
            >
              <CalendarDays size={18} className="shrink-0 text-mint-ink" />
              <span className={`flex-1 font-medium ${dueDate ? 'text-textdark' : 'text-dim'}`}>
                {dueDate ? formatTaskDate(dueDate) : 'Set a due date & time (optional)'}
              </span>
              {dueDate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDeadline();
                  }}
                  aria-label="Remove deadline"
                  className="shrink-0 rounded-full p-1 text-dim hover:text-danger"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={submit}
            className="glass-accent flex flex-1 items-center justify-center gap-2 rounded-[14px] py-3 font-semibold text-white"
          >
            <Trash2 size={16} className="rotate-45" />
            {isEditing ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
        {isEditing && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => onSave({ title: '', note: '', category, delete: true })}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-danger/40 py-3 font-semibold text-danger"
            >
              <Trash2 size={16} />
              Delete Task
            </button>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function toTimeString(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
