import { notFoundOrForbidden } from './errors.js';

/**
 * Ownership enforcement, in one place.
 *
 * Every user-owned resource goes through here rather than each service
 * re-implementing the check. The rule it encodes: a row you do not own is
 * indistinguishable from a row that does not exist. Returning 403 would confirm
 * the id is real, which is exactly the fact an attacker is probing for.
 */

/**
 * Fetch a row by id and assert the caller owns it.
 *
 * @param {object} params
 * @param {object} params.model     Prisma delegate, e.g. `app.prisma.task`.
 * @param {string} params.id
 * @param {string} params.userId    From the access token, never from input.
 * @param {string} [params.ownerField='userId']
 * @param {string} [params.resource='Resource']
 * @param {object} [params.include]
 */
export async function findOwned({
  model,
  id,
  userId,
  ownerField = 'userId',
  resource = 'Resource',
  include,
}) {
  const row = await model.findFirst({
    // Scoped in the WHERE clause rather than fetched-then-compared, so the
    // database never returns another user's data to this process at all.
    where: { id, [ownerField]: userId },
    ...(include ? { include } : {}),
  });

  if (!row) throw notFoundOrForbidden(resource);
  return row;
}

/**
 * Assert ownership without needing the row back.
 * @returns {Promise<void>}
 */
export async function assertOwned({
  model,
  id,
  userId,
  ownerField = 'userId',
  resource = 'Resource',
}) {
  const count = await model.count({ where: { id, [ownerField]: userId } });
  if (count === 0) throw notFoundOrForbidden(resource);
}

/**
 * Delete a row only if the caller owns it.
 *
 * `deleteMany` with an owner-scoped filter is deliberate: `delete` by id would
 * need a separate read first, leaving a window where the row could change
 * hands between the check and the write.
 */
export async function deleteOwned({
  model,
  id,
  userId,
  ownerField = 'userId',
  resource = 'Resource',
}) {
  const { count } = await model.deleteMany({ where: { id, [ownerField]: userId } });
  if (count === 0) throw notFoundOrForbidden(resource);
}

/**
 * Update a row only if the caller owns it, returning the new version.
 */
export async function updateOwned({
  model,
  id,
  userId,
  data,
  ownerField = 'userId',
  resource = 'Resource',
}) {
  const { count } = await model.updateMany({ where: { id, [ownerField]: userId }, data });
  if (count === 0) throw notFoundOrForbidden(resource);
  return model.findUnique({ where: { id } });
}
