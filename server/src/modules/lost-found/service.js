import { notFoundOrForbidden, NotFoundError } from '../../lib/errors.js';
import { toPage, toPrismaPage } from '../../lib/pagination.js';
import { toLostFoundResponse } from './schema.js';

/**
 * Lost & found. Community-visible reads, owner-only writes.
 */

const include = {
  reporter: { select: { name: true } },
  images: { orderBy: { position: 'asc' } },
};

/**
 * Attach uploaded images, verifying the caller owns each file.
 *
 * Without this check a user could reference someone else's file id and have it
 * rendered under their own listing — a way to read back private uploads.
 */
async function linkImages(app, tx, { itemId, userId, imageIds }) {
  if (!imageIds?.length) return;

  const owned = await tx.fileObject.findMany({
    where: { id: { in: imageIds }, ownerId: userId },
    select: { id: true },
  });
  if (owned.length !== imageIds.length) {
    throw new NotFoundError('One or more images could not be found');
  }

  await tx.lostFoundImage.createMany({
    data: imageIds.map((fileId, position) => ({ itemId, fileId, position })),
  });
}

export async function listItems(app, viewerId, query) {
  const rows = await app.prisma.lostFoundItem.findMany({
    where: {
      status: query.status,
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.mine ? { reporterId: viewerId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { color: { contains: query.search, mode: 'insensitive' } },
              { room: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ occurredOn: 'desc' }, { id: 'desc' }],
    include,
    ...toPrismaPage(query),
  });

  const page = toPage(rows, query.limit);
  return { ...page, items: page.items.map((row) => toLostFoundResponse(row, viewerId)) };
}

/** Distinct categories actually in use, for the filter chip row. */
export async function listCategories(app) {
  const rows = await app.prisma.lostFoundItem.findMany({
    where: { status: 'OPEN' },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' },
  });
  return rows.map((r) => r.category);
}

export async function getItem(app, viewerId, id) {
  const row = await app.prisma.lostFoundItem.findUnique({ where: { id }, include });
  if (!row) throw new NotFoundError('Item not found');
  return toLostFoundResponse(row, viewerId);
}

export async function createItem(app, userId, input) {
  const { imageIds, ...rest } = input;

  const id = await app.prisma.$transaction(async (tx) => {
    const row = await tx.lostFoundItem.create({ data: { reporterId: userId, ...rest } });
    await linkImages(app, tx, { itemId: row.id, userId, imageIds });
    return row.id;
  });

  return getItem(app, userId, id);
}

export async function updateItem(app, userId, id, input) {
  const { imageIds, ...rest } = input;

  const { count } = await app.prisma.lostFoundItem.updateMany({
    where: { id, reporterId: userId },
    data: rest,
  });
  if (count === 0) throw notFoundOrForbidden('Item');

  if (imageIds) {
    // Replace wholesale: the client sends the full desired set, which is
    // simpler to reason about than a diff and cannot leave orphans.
    await app.prisma.$transaction(async (tx) => {
      await tx.lostFoundImage.deleteMany({ where: { itemId: id } });
      await linkImages(app, tx, { itemId: id, userId, imageIds });
    });
  }

  return getItem(app, userId, id);
}

export async function deleteItem(app, userId, id) {
  const { count } = await app.prisma.lostFoundItem.deleteMany({
    where: { id, reporterId: userId },
  });
  if (count === 0) throw notFoundOrForbidden('Item');
}

/** Backs the dashboard's "N items" chip. */
export async function countOpenItems(app) {
  return app.prisma.lostFoundItem.count({ where: { status: 'OPEN' } });
}
