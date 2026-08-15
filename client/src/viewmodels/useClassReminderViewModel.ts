import { useCallback, useEffect, useState } from 'react';
import type { AssessmentTypeName, ClassReminder } from '../models/classReminder';
import { academicRepository } from '../repositories/academic';
import { ApiError } from '../api/errors';

// Mirrors ClassReminderViewModel in lib/viewmodels/class_reminder_view_model.dart.
// Previously held six hardcoded reminders in an array literal; toggling one
// changed nothing beyond this component's lifetime. Reminders now belong to
// the signed-in user on the server, so they persist and follow them between
// devices. Writes are optimistic — a toggle flips immediately and rolls back
// if the server rejects it.

/** "10:00 AM" (what the UI collects) -> "10:00" (what the API stores). */
function to24Hour(display: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/.exec(display.trim());
  if (!match) return display;
  let hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, '0')}:${minute}`;
}

/** "13:00" -> "1:00 PM", for display. */
function to12Hour(raw: string): string {
  const parts = raw.split(':');
  if (parts.length !== 2) return raw;
  const hour = Number.parseInt(parts[0], 10) || 0;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${parts[1]} ${suffix}`;
}

function titleCase(value: string): string {
  return value.length ? value[0] + value.slice(1).toLowerCase() : value;
}

function assessmentType(raw: string): AssessmentTypeName {
  if (raw === 'QUIZ') return 'quiz';
  if (raw === 'LAB') return 'lab';
  return 'mid';
}

export function useClassReminderViewModel() {
  const [reminders, setReminders] = useState<ClassReminder[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [assessmentDialogIndex, setAssessmentDialogIndex] = useState<number | null>(null);

  const enabledCount = reminders.filter((r) => r.isEnabled).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await academicRepository.listClassReminders();
      setIds(rows.map((row) => row.id as string));
      setReminders(
        rows.map((row) => ({
          courseName: row.courseName as string,
          weekday: titleCase(row.weekday as string),
          classTime: to12Hour(row.classTime as string),
          isEnabled: (row.isEnabled as boolean | undefined) ?? true,
          minutesBefore: (row.minutesBefore as number | undefined) ?? 10,
          assessments: ((row.assessments as { type: string; dateTime: string }[] | undefined) ?? []).map(
            (a) => ({ type: assessmentType(a.type), dateTime: new Date(a.dateTime) }),
          ),
        })),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load reminders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleReminder(index: number) {
    const reminder = reminders[index];
    const next = !reminder.isEnabled;

    setReminders((prev) => prev.map((r, i) => (i === index ? { ...r, isEnabled: next } : r)));
    setIsSaved(false);

    try {
      await academicRepository.updateClassReminder(ids[index], { isEnabled: next });
    } catch (err) {
      setReminders((prev) => prev.map((r, i) => (i === index ? { ...r, isEnabled: !next } : r)));
      setError(err instanceof ApiError ? err.message : 'Could not update the reminder.');
    }
  }

  async function updateMinutesBefore(index: number, minutes: number) {
    const previous = reminders[index].minutesBefore;

    setReminders((prev) => prev.map((r, i) => (i === index ? { ...r, minutesBefore: minutes } : r)));
    setIsSaved(false);

    try {
      await academicRepository.updateClassReminder(ids[index], { minutesBefore: minutes });
    } catch (err) {
      setReminders((prev) =>
        prev.map((r, i) => (i === index ? { ...r, minutesBefore: previous } : r)),
      );
      setError(err instanceof ApiError ? err.message : 'Could not update the reminder.');
    }
  }

  async function addReminder(courseName: string, weekday: string, classTime: string) {
    try {
      await academicRepository.createClassReminder({
        courseName,
        weekday: weekday.toUpperCase(),
        classTime: to24Hour(classTime),
        minutesBefore: 10,
      });
      // Reload rather than insert locally: the server sorts by campus
      // weekday order, which is not the order rows were created in.
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add the course.');
    }
  }

  async function addAssessmentReminder(courseIndex: number, type: AssessmentTypeName, dateTime: Date) {
    try {
      await academicRepository.addAssessment(ids[courseIndex], {
        type: type.toUpperCase(),
        dateTime: dateTime.toISOString(),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add the reminder.');
    }
  }

  async function deleteReminder(index: number) {
    try {
      await academicRepository.deleteClassReminder(ids[index]);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the reminder.');
    }
  }

  // Every change is already persisted as it happens; this only drives the
  // "Saved" confirmation banner.
  function saveSettings() {
    setIsSaved(true);
  }

  return {
    reminders,
    enabledCount,
    isSaved,
    loading,
    error,
    reload: load,
    addDialogOpen,
    setAddDialogOpen,
    assessmentDialogIndex,
    setAssessmentDialogIndex,
    toggleReminder,
    updateMinutesBefore,
    addReminder,
    addAssessmentReminder,
    deleteReminder,
    saveSettings,
  };
}
