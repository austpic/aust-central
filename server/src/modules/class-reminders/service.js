import { assertOwned, deleteOwned, findOwned, updateOwned } from '../../lib/ownership.js';
import { NotFoundError } from '../../lib/errors.js';
import { toReminderResponse } from './schema.js';

/**
 * Class reminders. Replaces the six hardcoded entries in
 * ClassReminderViewModel, whose toggles lived only in memory.
 */

const WEEKDAY_ORDER = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export async function listReminders(app, userId) {
  const rows = await app.prisma.classReminder.findMany({
    where: { userId },
    include: { assessments: { orderBy: { dateTime: 'asc' } } },
  });

  // Sorted in JS because the enum's storage order is not the timetable order
  // students expect (the campus week starts Sunday).
  rows.sort((a, b) => {
    const day = WEEKDAY_ORDER[a.weekday] - WEEKDAY_ORDER[b.weekday];
    // classTime is zero-padded "HH:mm", so lexical compare is chronological.
    return day !== 0 ? day : a.classTime.localeCompare(b.classTime);
  });

  return rows.map(toReminderResponse);
}

export async function getReminder(app, userId, id) {
  const row = await findOwned({
    model: app.prisma.classReminder,
    id,
    userId,
    resource: 'Class reminder',
    include: { assessments: { orderBy: { dateTime: 'asc' } } },
  });
  return toReminderResponse(row);
}

export async function createReminder(app, userId, input) {
  const row = await app.prisma.classReminder.create({
    data: { userId, ...input },
    include: { assessments: true },
  });
  return toReminderResponse(row);
}

export async function updateReminder(app, userId, id, input) {
  await updateOwned({
    model: app.prisma.classReminder,
    id,
    userId,
    data: input,
    resource: 'Class reminder',
  });
  return getReminder(app, userId, id);
}

export async function deleteReminder(app, userId, id) {
  await deleteOwned({
    model: app.prisma.classReminder,
    id,
    userId,
    resource: 'Class reminder',
  });
}

export async function addAssessment(app, userId, reminderId, input) {
  // The child is only reachable through a parent the caller owns; checking the
  // parent first is what stops someone attaching rows to a stranger's reminder.
  await assertOwned({
    model: app.prisma.classReminder,
    id: reminderId,
    userId,
    resource: 'Class reminder',
  });

  await app.prisma.assessmentReminder.create({
    data: { classReminderId: reminderId, type: input.type, dateTime: input.dateTime },
  });

  return getReminder(app, userId, reminderId);
}

export async function deleteAssessment(app, userId, reminderId, assessmentId) {
  await assertOwned({
    model: app.prisma.classReminder,
    id: reminderId,
    userId,
    resource: 'Class reminder',
  });

  const { count } = await app.prisma.assessmentReminder.deleteMany({
    where: { id: assessmentId, classReminderId: reminderId },
  });
  if (count === 0) throw new NotFoundError('Assessment not found');
}

/**
 * The next enabled class from now, wrapping into next week if needed.
 * Backs the dashboard's "Next Class: 02:30 pm" chip.
 */
export async function nextClass(app, userId, now = new Date()) {
  const reminders = await app.prisma.classReminder.findMany({
    where: { userId, isEnabled: true },
  });
  if (reminders.length === 0) return null;

  const todayIndex = now.getDay(); // 0 = Sunday, matching WEEKDAY_ORDER
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let best = null;
  for (const reminder of reminders) {
    const [hour, minute] = reminder.classTime.split(':').map(Number);
    let delta = (WEEKDAY_ORDER[reminder.weekday] - todayIndex) * 1440
      + (hour * 60 + minute - nowMinutes);
    // Already passed this week — roll it to the same slot next week.
    if (delta < 0) delta += 7 * 1440;
    if (!best || delta < best.delta) best = { delta, reminder };
  }

  return best
    ? { ...toReminderResponse({ ...best.reminder, assessments: [] }), minutesUntil: best.delta }
    : null;
}
