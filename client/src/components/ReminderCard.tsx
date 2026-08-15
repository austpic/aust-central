import { Bell, ChevronDown, CalendarCheck } from 'lucide-react';
import type { ClassReminder } from '../models/classReminder';
import { assessmentLabel } from '../models/classReminder';
import { MINUTE_OPTIONS } from '../data/classReminders';

// Mirrors _ReminderCard in lib/screens/class_reminder_screen.dart
export default function ReminderCard({
  reminder,
  onCardTap,
  onToggle,
  onMinutesChanged,
}: {
  reminder: ClassReminder;
  onCardTap: () => void;
  onToggle: () => void;
  onMinutesChanged: (minutes: number) => void;
}) {
  const active = reminder.isEnabled;

  return (
    <div
      className="glass glass-sheen cursor-pointer rounded-[18px] p-4 transition-all duration-200"
      style={{
        border: `1.5px solid ${active ? 'rgba(13,122,61,0.32)' : 'rgba(16,36,26,0.12)'}`,
        boxShadow: active
          ? 'inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 1px rgba(22,36,29,0.06), 0 12px 30px -10px rgba(13,122,61,0.2)'
          : 'inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 1px rgba(22,36,29,0.06), 0 10px 26px -12px rgba(22,36,29,0.12)',
      }}
      onClick={onCardTap}
    >
      <div className="flex items-center">
        <div
          className="glass-tint flex h-[42px] w-[42px] items-center justify-center rounded-[12px]"
          style={{
            backgroundColor: active ? 'rgba(110,242,165,0.16)' : 'rgba(16,36,26,0.06)',
          }}
        >
          <Bell
            size={22}
            style={{ color: active ? '#0d7a3d' : 'rgba(22,36,29,0.4)' }}
          />
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <div
            className={`truncate font-display text-[15px] font-bold ${
              active ? 'text-textdark' : 'text-dim'
            }`}
          >
            {reminder.courseName}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-dim">
            {reminder.weekday} • {reminder.classTime}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`h-7 w-[46px] shrink-0 rounded-full transition-colors ${
            active ? 'bg-lightaccent/70' : 'bg-border/25'
          }`}
        >
          <span
            className={`glass block h-6 w-6 rounded-full transition-transform ${
              active ? 'translate-x-[21px]' : 'translate-x-0.5'
            }`}
            style={{
              backgroundColor: active ? '#fff' : '#e7e9e7',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.14)',
            }}
          />
        </button>
      </div>

      {active && (
        <div className="mt-4 flex items-center rounded-[12px] border border-border/30 bg-lightaccent/30 px-4 py-1">
          <CalendarCheck size={18} className="text-primary" />
          <span className="ml-3 text-[13px] font-semibold text-cgpamedium">
            Remind before
          </span>
          <span className="ml-auto">
            <select
              value={reminder.minutesBefore}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onMinutesChanged(Number(e.target.value))}
              className="cursor-pointer appearance-none bg-transparent py-2 pr-5 text-[14px] font-bold text-primary outline-none"
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="-ml-5 inline-block text-primary" />
          </span>
        </div>
      )}

      {reminder.assessments.length > 0 && (
        <>
          <div className="my-4 border-t border-border/40" />
          <div className="mt-1 space-y-2">
            {reminder.assessments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-semibold text-cgpamedium">
                <CalendarCheck size={17} className="shrink-0 text-primary" />
                <span>
                  {assessmentLabel(a.type)}: {a.dateTime.getDate()}/{a.dateTime.getMonth() + 1}/{a.dateTime.getFullYear()} •{' '}
                  {a.dateTime.getHours() % 12 === 0
                    ? 12
                    : a.dateTime.getHours() % 12}
                  :{a.dateTime.getMinutes().toString().padStart(2, '0')}{' '}
                  {a.dateTime.getHours() >= 12 ? 'PM' : 'AM'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
