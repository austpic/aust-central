import { useState } from 'react';
import { AlarmClock, Plus, CalendarPlus, CheckCircle2, Clock } from 'lucide-react';
import ReminderCard from '../components/ReminderCard';
import { Dialog } from '../components/Modal';
import Field from '../components/Field';
import SectionLabel from '../components/SectionLabel';
import { useClassReminderViewModel } from '../viewmodels/useClassReminderViewModel';
import { LoadingState, ErrorState } from '../components/AsyncState';
import {
  ASSESSMENT_TYPES,
  WEEKDAYS,
  type AssessmentTypeName,
} from '../models/classReminder';

function formatTimeFromInput(value: string): string {
  const [h, m] = value.split(':').map((x) => Number(x));
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

export default function ClassReminderView() {
  const vm = useClassReminderViewModel();

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Header */}
      <div
        className="glass-accent glass-sheen flex items-center rounded-[22px] px-5 py-5 text-white"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <AlarmClock size={26} />
        </div>
        <div className="ml-4">
          <div className="font-display text-[20px] font-bold">Reminder Settings</div>
          <div className="mt-0.5 text-[13px] text-white/85">
            {vm.enabledCount} of {vm.reminders.length} Active
          </div>
        </div>
      </div>

      {/* Add course */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => vm.setAddDialogOpen(true)}
          className="glass flex h-[48px] w-full items-center justify-center gap-2 rounded-[16px] font-bold text-primary hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Add Course
        </button>
      </div>

      <div className="mt-6">
        <SectionLabel label="Your Courses" count={vm.reminders.length} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4">
        {vm.loading ? (
          <LoadingState />
        ) : vm.error ? (
          <ErrorState message={vm.error} onRetry={vm.reload} />
        ) : (
          vm.reminders.map((reminder, index) => (
            <ReminderCard
              key={index}
              reminder={reminder}
              onCardTap={() => vm.setAssessmentDialogIndex(index)}
              onToggle={() => vm.toggleReminder(index)}
              onMinutesChanged={(minutes) => vm.updateMinutesBefore(index, minutes)}
            />
          ))
        )}
      </div>

      {vm.isSaved && (
        <div className="glass-tint mt-4 flex items-center gap-3 rounded-[14px] px-4 py-3">
          <CheckCircle2 size={20} className="text-mint-ink" />
          <span className="text-[14px] font-semibold text-mint-ink">
            Settings saved successfully!
          </span>
        </div>
      )}

      <div className="mt-4 pb-2">
        <button
          type="button"
          onClick={vm.saveSettings}
          className="glass-accent glass-sheen h-[54px] w-full rounded-[16px] text-[16px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          Save Settings
        </button>
      </div>

      {vm.addDialogOpen && (
        <AddCourseDialog
          onClose={() => vm.setAddDialogOpen(false)}
          onAdd={(name, weekday, time) => {
            vm.addReminder(name, weekday, time);
            vm.setAddDialogOpen(false);
          }}
        />
      )}

      {vm.assessmentDialogIndex !== null && (
        <AssessmentDialog
          courseName={vm.reminders[vm.assessmentDialogIndex]?.courseName ?? ''}
          onClose={() => vm.setAssessmentDialogIndex(null)}
          onSave={(type, dateTime) => {
            const index = vm.assessmentDialogIndex;
            if (index !== null) {
              vm.addAssessmentReminder(index, type, dateTime);
              vm.setAssessmentDialogIndex(null);
            }
          }}
        />
      )}
    </div>
  );
}

function AddCourseDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, weekday: string, time: string) => void;
}) {
  const [name, setName] = useState('');
  const [weekday, setWeekday] = useState('Sunday');
  const [time, setTime] = useState('09:00');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a course name');
      return;
    }
    onAdd(trimmed, weekday, formatTimeFromInput(time));
  }

  return (
    <Dialog title="Add Course" onClose={onClose}>
      <Field
        label="Course Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (error) setError(null);
        }}
        placeholder="e.g. Operating Systems"
        autoFocus
      />
      {error && <div className="mt-1 text-xs text-danger">{error}</div>}
      <div className="mt-4">
        <div className="mb-2 text-[13px] font-semibold text-labtext">Weekday</div>
        <select
          value={weekday}
          onChange={(e) => setWeekday(e.target.value)}
          className="glass-input w-full rounded-[14px] px-4 py-3 text-[15px] font-medium text-labtext outline-none"
        >
          {WEEKDAYS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <div className="mb-2 text-[13px] font-semibold text-labtext">Class Time</div>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="glass-input w-full rounded-[14px] px-4 py-3 text-[15px] font-medium text-labtext outline-none"
        />
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="glass-tint flex-1 rounded-[14px] py-3 font-semibold text-dim"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          className="glass-accent flex-[2] rounded-[14px] py-3 font-semibold text-white"
        >
          Add Course
        </button>
      </div>
    </Dialog>
  );
}

function AssessmentDialog({
  courseName,
  onClose,
  onSave,
}: {
  courseName: string;
  onClose: () => void;
  onSave: (type: AssessmentTypeName, dateTime: Date) => void;
}) {
  const [type, setType] = useState<AssessmentTypeName>('quiz');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!date) {
      setError('Please pick a date');
      return;
    }
    const dateTime = new Date(`${date}T${time || '09:00'}`);
    onSave(type, dateTime);
  }

  return (
    <Dialog title={`Add Reminder · ${courseName}`} onClose={onClose}>
      <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-labtext">
        <CalendarPlus size={16} className="text-primary" />
        Assessment Type
      </div>
      <div className="flex gap-2">
        {ASSESSMENT_TYPES.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => setType(t.name)}
            className={`flex-1 rounded-[12px] py-3 text-[14px] font-semibold transition-all duration-200 ${
              type === t.name ? 'glass-pill-active' : 'glass-tint text-labtext'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-labtext">
          <Clock size={16} className="text-primary" />
          Date & Time
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (error) setError(null);
            }}
            className="glass-input w-full rounded-[14px] px-3 py-3 text-[14px] font-medium text-labtext outline-none"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="glass-input w-full rounded-[14px] px-3 py-3 text-[14px] font-medium text-labtext outline-none"
          />
        </div>
        {error && <div className="mt-2 text-xs text-danger">{error}</div>}
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="glass-tint flex-1 rounded-[14px] py-3 font-semibold text-dim"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          className="glass-accent flex-[2] rounded-[14px] py-3 font-semibold text-white"
        >
          Save Reminder
        </button>
      </div>
    </Dialog>
  );
}
