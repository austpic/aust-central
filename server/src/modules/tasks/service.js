import { deleteOwned, findOwned, updateOwned } from '../../lib/ownership.js';
import { toPage, toPrismaPage } from '../../lib/pagination.js';
import { toTaskResponse } from './schema.js';

/**
 * To-do list. Replaces the in-memory `_tasks` array in todo_list_screen.dart,
 * which lost everything the moment the screen was popped.
 */

/** Translate the client's filter tab into a Prisma predicate. */
function filterWhere(filter) {
  switch (filter) {
    case 'today':
      return { category: 'TODAY', isDone: false };
    case 'later':
      return { category: 'LATER', isDone: false };
    case 'completed':
      return { isDone: true };
    default:
      return {};
  }
}

export async function listTasks(app, userId, query) {
  const rows = await app.prisma.task.findMany({
    where: {
      userId,
      ...filterWhere(query.filter),
      ...(query.search
        ? {
            // Case-insensitive contains; Prisma parameterises this, so the
            // user's search string is never interpolated into SQL.
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { note: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    // Deterministic ordering — id breaks ties so cursor paging cannot loop or
    // skip when two rows share a timestamp.
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    ...toPrismaPage(query),
  });

  const page = toPage(rows, query.limit);
  return { ...page, items: page.items.map(toTaskResponse) };
}

export async function getTask(app, userId, id) {
  const task = await findOwned({
    model: app.prisma.task,
    id,
    userId,
    resource: 'Task',
  });
  return toTaskResponse(task);
}

export async function createTask(app, userId, input) {
  const task = await app.prisma.task.create({
    data: {
      userId,
      title: input.title,
      note: input.note ?? '',
      category: input.category ?? 'TODAY',
      dueDate: input.dueDate ?? null,
    },
  });
  return toTaskResponse(task);
}

export async function updateTask(app, userId, id, input) {
  const data = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.note !== undefined) data.note = input.note;
  if (input.category !== undefined) data.category = input.category;
  if (input.isDone !== undefined) data.isDone = input.isDone;
  // `null` clears the due date; `undefined` leaves it alone. The distinction
  // matters — the app's Task.copyWith has an explicit clearDueDate flag.
  if (input.dueDate !== undefined) data.dueDate = input.dueDate;

  const task = await updateOwned({
    model: app.prisma.task,
    id,
    userId,
    data,
    resource: 'Task',
  });
  return toTaskResponse(task);
}

export async function deleteTask(app, userId, id) {
  await deleteOwned({ model: app.prisma.task, id, userId, resource: 'Task' });
}

/** Backs the dashboard's "N due today" chip, which is currently hardcoded. */
export async function countDueToday(app, userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return app.prisma.task.count({
    where: { userId, isDone: false, dueDate: { gte: start, lt: end } },
  });
}
