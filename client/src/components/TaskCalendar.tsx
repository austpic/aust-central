import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

// Date-picker calendar for the To-do List. Pure presentational — all state
// (viewed month, selected day, task counts) is owned by the ViewModel.
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function TaskCalendar({
  viewDate,
  selectedDate,
  taskCountOn,
  onSelect,
  onPrevMonth,
  onNextMonth,
  onToday,
}: {
  viewDate: Date;
  selectedDate: Date | null;
  taskCountOn?: (date: Date) => number;
  onSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}) {
  const showDots = typeof taskCountOn === 'function';
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sel = selectedDate
    ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    : null;

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <div className="glass rounded-[20px] p-5">
      {/* Header — month + prev/next + today */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Previous month"
          className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-textdark transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 font-display text-[15px] font-bold text-textdark">
            <CalendarDays size={16} className="text-mint-ink" />
            {MONTHS[month]} {year}
          </div>
          <button
            type="button"
            onClick={onToday}
            className="mt-0.5 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-mint-ink transition-colors hover:bg-mint/15"
          >
            Today
          </button>
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Next month"
          className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-textdark transition-transform duration-200 hover:-translate-y-0.5"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="mt-4 grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-2 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-dim2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((date, i) =>
          date === null ? (
            <div key={`empty-${i}`} className="flex h-10 items-center justify-center" />
          ) : (
            <DayCell
              key={date.toISOString()}
              date={date}
              isToday={date.getTime() === today.getTime()}
              isSelected={sel !== null && date.getTime() === sel.getTime()}
              hasTasks={showDots && taskCountOn!(date) > 0}
              onSelect={onSelect}
            />
          ),
        )}
      </div>

      {/* Legend — only shown when task counts are provided */}
      {showDots && (
        <div className="mt-4 flex items-center justify-center gap-5 border-t border-glass-border pt-3 text-[11px] text-dim">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-mint-deep" />
            Has tasks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-mint-ink/50" />
            Today
          </span>
        </div>
      )}
    </div>
  );
}

function DayCell({
  date,
  isToday,
  isSelected,
  hasTasks,
  onSelect,
}: {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  hasTasks: boolean;
  onSelect: (date: Date) => void;
}) {
  const base =
    'relative flex h-10 w-10 items-center justify-center rounded-full text-[13px] transition-colors duration-150 mx-auto';
  const state = isSelected
    ? 'bg-primary font-bold text-white shadow-[0_4px_12px_rgba(13,122,61,0.4)]'
    : isToday
      ? 'border-[1.5px] border-mint-ink/50 font-bold text-mint-ink'
      : 'font-semibold text-textdark hover:glass-tint';

  return (
    <button type="button" onClick={() => onSelect(date)} className={`${base} ${state}`}>
      {date.getDate()}
      {hasTasks && (
        <span
          className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-mint-deep'}`}
        />
      )}
    </button>
  );
}
