// Mirrors the seed data in lib/viewmodels/class_reminder_viewmodel.dart
import type { ClassReminder } from '../models/classReminder';

export const SEED_REMINDERS: ClassReminder[] = [
  { courseName: 'Data Structures', weekday: 'Sunday', classTime: '10:00 AM', isEnabled: true, minutesBefore: 10, assessments: [] },
  { courseName: 'Database Systems', weekday: 'Tuesday', classTime: '1:00 PM', isEnabled: true, minutesBefore: 15, assessments: [] },
  { courseName: 'Digital Logic Design', weekday: 'Tuesday', classTime: '2:00 PM', isEnabled: false, minutesBefore: 5, assessments: [] },
  { courseName: 'Discrete Mathematics', weekday: 'Tuesday', classTime: '3:00 PM', isEnabled: true, minutesBefore: 10, assessments: [] },
  { courseName: 'English Composition', weekday: 'Monday', classTime: '4:00 PM', isEnabled: false, minutesBefore: 30, assessments: [] },
  { courseName: 'Physics Lab', weekday: 'Monday', classTime: '5:00 PM', isEnabled: true, minutesBefore: 15, assessments: [] },
];

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
