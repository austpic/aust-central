// Mirrors lib/models/class_reminder_model.dart
export type AssessmentTypeName = 'quiz' | 'mid' | 'lab';

export interface AssessmentType {
  name: AssessmentTypeName;
  label: string;
}

export const ASSESSMENT_TYPES: AssessmentType[] = [
  { name: 'quiz', label: 'Quiz' },
  { name: 'mid', label: 'Mid' },
  { name: 'lab', label: 'Lab Mid' },
];

export function assessmentLabel(name: AssessmentTypeName): string {
  const found = ASSESSMENT_TYPES.find((t) => t.name === name);
  return found ? found.label : name;
}

export interface AssessmentReminder {
  type: AssessmentTypeName;
  dateTime: Date;
}

export interface ClassReminder {
  courseName: string;
  weekday: string;
  classTime: string;
  isEnabled: boolean;
  minutesBefore: number;
  assessments: AssessmentReminder[];
}

export const WEEKDAYS = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

export const MINUTE_OPTIONS = [5, 10, 15, 30];
