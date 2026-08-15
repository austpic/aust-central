import { deleteOwned, findOwned, updateOwned } from '../../lib/ownership.js';
import { toPage, toPrismaPage } from '../../lib/pagination.js';
import { toLabReportResponse } from './schema.js';

/** Drafts for the lab report cover-page generator. PDF rendering stays client-side. */

export async function listDrafts(app, userId, query) {
  const rows = await app.prisma.labReportDraft.findMany({
    where: { userId },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    ...toPrismaPage(query),
  });
  const page = toPage(rows, query.limit);
  return { ...page, items: page.items.map(toLabReportResponse) };
}

export async function getDraft(app, userId, id) {
  const row = await findOwned({
    model: app.prisma.labReportDraft,
    id,
    userId,
    resource: 'Lab report',
  });
  return toLabReportResponse(row);
}

export async function createDraft(app, userId, input) {
  const row = await app.prisma.labReportDraft.create({ data: { userId, ...input } });
  return toLabReportResponse(row);
}

export async function updateDraft(app, userId, id, input) {
  const row = await updateOwned({
    model: app.prisma.labReportDraft,
    id,
    userId,
    data: input,
    resource: 'Lab report',
  });
  return toLabReportResponse(row);
}

export async function deleteDraft(app, userId, id) {
  await deleteOwned({
    model: app.prisma.labReportDraft,
    id,
    userId,
    resource: 'Lab report',
  });
}

/** Backs the dashboard's "N Drafts Saved" chip. */
export async function countDrafts(app, userId) {
  return app.prisma.labReportDraft.count({ where: { userId } });
}
