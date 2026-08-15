import { notFoundOrForbidden } from '../../lib/errors.js';
import { toPage, toPrismaPage } from '../../lib/pagination.js';
import { fromDbGroup, toDbGroup } from './schema.js';

/**
 * Blood bank.
 *
 * The eligibility rule is a port of BloodEligibility in the Flutter app, moved
 * here so it becomes authoritative. The client may keep its copy for instant
 * rendering, but "can this person donate" is now answered in one place — a
 * medical-adjacent rule should not be able to drift between screens, let alone
 * between app versions still in the wild.
 */

/** WHO-aligned whole-blood interval, matching the app's constant. */
export const DONATION_INTERVAL_DAYS = 90;

function daysSince(lastDonated, now = new Date()) {
  const last = new Date(lastDonated);
  // Compare calendar days, not elapsed milliseconds, so a donation "yesterday
  // evening" is one day ago rather than zero.
  const a = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((b - a) / 86_400_000);
}

export function eligibility(lastDonated, now = new Date()) {
  if (!lastDonated) {
    return {
      eligible: true,
      daysUntilEligible: 0,
      progress: 1,
      statusCopy: 'No donation recorded yet',
    };
  }

  const since = daysSince(lastDonated, now);
  const remaining = Math.max(0, DONATION_INTERVAL_DAYS - since);
  const progress = Math.min(1, Math.max(0, since / DONATION_INTERVAL_DAYS));

  return {
    eligible: remaining === 0,
    daysUntilEligible: remaining,
    progress,
    statusCopy:
      remaining === 0
        ? 'Eligible to donate now'
        : `${remaining} day${remaining === 1 ? '' : 's'} until eligible`,
  };
}

function toProfileResponse(profile) {
  const lastDonated = profile?.lastDonated ?? null;
  return {
    available: profile?.available ?? false,
    bloodGroup: fromDbGroup(profile?.bloodGroup ?? null),
    lastDonated,
    ...eligibility(lastDonated),
  };
}

export async function getDonorProfile(app, userId) {
  const profile = await app.prisma.donorProfile.findUnique({ where: { userId } });
  // A user who has never opened the screen has no row; return the empty shape
  // rather than 404 so the client has nothing special to handle.
  return toProfileResponse(profile);
}

export async function updateDonorProfile(app, userId, input) {
  const data = {};
  if (input.available !== undefined) data.available = input.available;
  if (input.bloodGroup !== undefined) data.bloodGroup = toDbGroup(input.bloodGroup);
  if (input.lastDonated !== undefined) data.lastDonated = input.lastDonated;

  const profile = await app.prisma.donorProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return toProfileResponse(profile);
}

// --- Requests ---------------------------------------------------------------

function toRequestResponse(row, viewerId) {
  return {
    id: row.id,
    patientName: row.patientName,
    bloodGroup: fromDbGroup(row.bloodGroup),
    hospital: row.hospital,
    location: row.location,
    units: row.units,
    urgency: row.urgency,
    requiredBy: row.requiredBy,
    contactNumber: row.contactNumber,
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt,
    requesterName: row.requester?.name ?? null,
    isMine: row.requesterId === viewerId,
  };
}

/**
 * Requests are community-visible by design — a request only helps if strangers
 * can see it. Contact numbers are therefore exposed to any signed-in user,
 * which is the intended trade-off, but it is why this endpoint requires a
 * session and is not public.
 */
export async function listRequests(app, viewerId, query) {
  const rows = await app.prisma.bloodRequest.findMany({
    where: {
      status: query.status,
      ...(query.bloodGroup ? { bloodGroup: toDbGroup(query.bloodGroup) } : {}),
      ...(query.urgency ? { urgency: query.urgency } : {}),
      ...(query.mine ? { requesterId: viewerId } : {}),
    },
    // Most urgent first, then soonest needed.
    orderBy: [{ urgency: 'desc' }, { requiredBy: 'asc' }, { id: 'asc' }],
    include: { requester: { select: { name: true } } },
    ...toPrismaPage(query),
  });

  const page = toPage(rows, query.limit);
  return { ...page, items: page.items.map((row) => toRequestResponse(row, viewerId)) };
}

export async function createRequest(app, userId, input) {
  const row = await app.prisma.bloodRequest.create({
    data: {
      requesterId: userId,
      ...input,
      bloodGroup: toDbGroup(input.bloodGroup),
    },
    include: { requester: { select: { name: true } } },
  });
  return toRequestResponse(row, userId);
}

/**
 * Only the requester may change status — closing someone else's request would
 * be a trivial way to hide an urgent appeal.
 */
export async function updateRequestStatus(app, userId, id, input) {
  const { count } = await app.prisma.bloodRequest.updateMany({
    where: { id, requesterId: userId },
    data: { status: input.status },
  });
  if (count === 0) throw notFoundOrForbidden('Blood request');

  const row = await app.prisma.bloodRequest.findUnique({
    where: { id },
    include: { requester: { select: { name: true } } },
  });
  return toRequestResponse(row, userId);
}

/** Backs the dashboard's "N requests nearby" chip. */
export async function countOpenRequests(app) {
  return app.prisma.bloodRequest.count({ where: { status: 'OPEN' } });
}
