import { NotFoundError } from '../../lib/errors.js';
import { toPage, toPrismaPage } from '../../lib/pagination.js';
import { toNoticeResponse } from './schema.js';

/**
 * Notice board — the one module with asymmetric access: every signed-in user
 * reads, only MODERATOR and ADMIN write. Enforced at the route via requireRole.
 *
 * Deletes are soft. A notice removed by mistake is recoverable, and the audit
 * trail of what the university announced stays intact.
 */

const authorSelect = { author: { select: { name: true } } };

export async function listNotices(app, query) {
  const rows = await app.prisma.notice.findMany({
    where: {
      deletedAt: null,
      ...(query.category ? { category: query.category } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { body: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    // Pinned first, then newest — matches the board's visual hierarchy.
    orderBy: [{ pinned: 'desc' }, { postedAt: 'desc' }, { id: 'desc' }],
    include: authorSelect,
    ...toPrismaPage(query),
  });

  const page = toPage(rows, query.limit);
  return { ...page, items: page.items.map(toNoticeResponse) };
}

export async function getNotice(app, id) {
  const row = await app.prisma.notice.findFirst({
    where: { id, deletedAt: null },
    include: authorSelect,
  });
  if (!row) throw new NotFoundError('Notice not found');
  return toNoticeResponse(row);
}

export async function createNotice(app, authorId, input) {
  const row = await app.prisma.notice.create({
    data: {
      authorId,
      title: input.title,
      body: input.body,
      category: input.category ?? 'GENERAL',
      pinned: input.pinned ?? false,
      postedAt: input.postedAt ?? new Date(),
    },
    include: authorSelect,
  });
  return toNoticeResponse(row);
}

export async function updateNotice(app, id, input) {
  const { count } = await app.prisma.notice.updateMany({
    where: { id, deletedAt: null },
    data: input,
  });
  if (count === 0) throw new NotFoundError('Notice not found');
  return getNotice(app, id);
}

export async function deleteNotice(app, id) {
  const { count } = await app.prisma.notice.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (count === 0) throw new NotFoundError('Notice not found');
}

/** Newest notice, for the dashboard's notice-board card. */
export async function latestNotice(app) {
  const row = await app.prisma.notice.findFirst({
    where: { deletedAt: null },
    orderBy: [{ pinned: 'desc' }, { postedAt: 'desc' }],
    include: authorSelect,
  });
  return row ? toNoticeResponse(row) : null;
}
