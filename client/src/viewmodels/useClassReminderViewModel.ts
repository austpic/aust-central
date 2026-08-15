import { useState } from 'react';
import type { AssessmentTypeName, ClassReminder } from '../models/classReminder';
import { SEED_REMINDERS } from '../data/classReminders';

// Mirrors ClassReminderViewModel in lib/viewmodels/class_reminder_viewmodel.dart
export function useClassReminderViewModel() {
  const [reminders, setReminders] = useState<ClassReminder[]>(SEED_REMINDERS);
  const [isSaved, setIsSaved] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [assessmentDialogIndex, setAssessmentDialogIndex] = useState<number | null>(null);

  const enabledCount = reminders.filter((r) => r.isEnabled).length;

  function toggleReminder(index: number) {
    setReminders((prev) =>
      prev.map((r, i) => (i === index ? { ...r, isEnabled: !r.isEnabled } : r)),
    );
    setIsSaved(false);
  }

  function updateMinutesBefore(index: number, minutes: number) {
    setReminders((prev) =>
      prev.map((r, i) => (i === index ? { ...r, minutesBefore: minutes } : r)),
    );
    setIsSaved(false);
  }

  function addReminder(courseName: string, weekday: string, classTime: string) {
    setReminders((prev) => [
      ...prev,
      { courseName, weekday, classTime, isEnabled: true, minutesBefore: 10, assessments: [] },
    ]);
    setIsSaved(false);
  }

  function addAssessmentReminder(
    courseIndex: number,
    type: AssessmentTypeName,
    dateTime: Date,
  ) {
    setReminders((prev) =>
      prev.map((r, i) =>
        i === courseIndex ? { ...r, assessments: [...r.assessments, { type, dateTime }] } : r,
      ),
    );
    setIsSaved(false);
  }

  function saveSettings() {
    setIsSaved(true);
  }

  return {
    reminders,
    enabledCount,
    isSaved,
    addDialogOpen,
    setAddDialogOpen,
    assessmentDialogIndex,
    setAssessmentDialogIndex,
    toggleReminder,
    updateMinutesBefore,
    addReminder,
    addAssessmentReminder,
    saveSettings,
  };
}
