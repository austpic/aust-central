import {
  BadRequestError,
  ConflictError,
  notFoundOrForbidden,
  NotFoundError,
} from '../../lib/errors.js';
import { toPage, toPrismaPage } from '../../lib/pagination.js';

/**
 * Book exchange: listings, saved items, buyer/seller chat, and seller reviews.
 *
 * The chat here replaces the local mock in in_app_chat_page.dart. Because it is
 * the only place two users exchange free text, participant checks are enforced
 * on every read and write — a conversation id alone must never grant access.
 */

const listingInclude = {
  images: { orderBy: { position: 'asc' } },
  seller: { select: { id: true, name: true, department: true } },
};

/** Average seller rating, computed rather than stored so it cannot go stale. */
async function ratingsFor(app, sellerIds) {
  if (sellerIds.length === 0) return new Map();
  const rows = await app.prisma.sellerReview.groupBy({
    by: ['sellerId'],
    where: { sellerId: { in: sellerIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return new Map(
    rows.map((r) => [
      r.sellerId,
      { rating: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : null, reviewCount: r._count.rating },
    ]),
  );
}

function toListingResponse(row, viewerId, ratings, bookmarkedIds) {
  const stats = ratings.get(row.sellerId) ?? { rating: null, reviewCount: 0 };
  return {
    id: row.id,
    title: row.title,
    courseCode: row.courseCode,
    department: row.department,
    semester: row.semester,
    condition: row.condition,
    listingType: row.listingType,
    priceBdt: row.priceBdt,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt,
    imageIds: (row.images ?? []).map((i) => i.fileId),
    seller: {
      id: row.seller.id,
      name: row.seller.name,
      department: row.seller.department,
      rating: stats.rating,
      reviewCount: stats.reviewCount,
    },
    isMine: row.sellerId === viewerId,
    isBookmarked: bookmarkedIds.has(row.id),
  };
}

/** Verify the caller owns each referenced upload before attaching it. */
async function linkImages(app, tx, { listingId, userId, imageIds }) {
  if (!imageIds?.length) return;
  const owned = await tx.fileObject.count({
    where: { id: { in: imageIds }, ownerId: userId },
  });
  if (owned !== imageIds.length) {
    throw new NotFoundError('One or more images could not be found');
  }
  await tx.bookImage.createMany({
    data: imageIds.map((fileId, position) => ({ listingId, fileId, position })),
  });
}

function orderFor(sort) {
  switch (sort) {
    case 'department':
      return [{ department: 'asc' }, { id: 'asc' }];
    case 'courseCode':
      return [{ courseCode: 'asc' }, { id: 'asc' }];
    case 'semester':
      return [{ semester: 'asc' }, { id: 'asc' }];
    case 'freeFirst':
      // SALE sorts last alphabetically among FREE/SALE/SWAP, so descending
      // puts SWAP and FREE ahead of it — matching the app's "Free/Swap" filter.
      return [{ listingType: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }];
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
  }
}

export async function listListings(app, viewerId, query) {
  const where = {
    ...(query.tab === 'mine' ? { sellerId: viewerId } : { status: 'ACTIVE' }),
    ...(query.tab === 'saved' ? { bookmarks: { some: { userId: viewerId } } } : {}),
    ...(query.department ? { department: query.department } : {}),
    ...(query.courseCode ? { courseCode: query.courseCode } : {}),
    ...(query.semester ? { semester: query.semester } : {}),
    ...(query.listingType ? { listingType: query.listingType } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { courseCode: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const rows = await app.prisma.bookListing.findMany({
    where,
    orderBy: orderFor(query.sort),
    include: listingInclude,
    ...toPrismaPage(query),
  });

  const page = toPage(rows, query.limit);
  const ratings = await ratingsFor(app, [...new Set(page.items.map((r) => r.sellerId))]);
  const bookmarks = await app.prisma.bookmark.findMany({
    where: { userId: viewerId, listingId: { in: page.items.map((r) => r.id) } },
    select: { listingId: true },
  });
  const bookmarked = new Set(bookmarks.map((b) => b.listingId));

  return {
    ...page,
    items: page.items.map((row) => toListingResponse(row, viewerId, ratings, bookmarked)),
  };
}

export async function getListing(app, viewerId, id) {
  const row = await app.prisma.bookListing.findUnique({
    where: { id },
    include: listingInclude,
  });
  // Removed listings are invisible to everyone but their owner.
  if (!row || (row.status === 'REMOVED' && row.sellerId !== viewerId)) {
    throw new NotFoundError('Listing not found');
  }

  const ratings = await ratingsFor(app, [row.sellerId]);
  const bookmark = await app.prisma.bookmark.count({
    where: { userId: viewerId, listingId: id },
  });
  return toListingResponse(row, viewerId, ratings, new Set(bookmark ? [id] : []));
}

export async function createListing(app, userId, input) {
  const { imageIds, ...rest } = input;

  const id = await app.prisma.$transaction(async (tx) => {
    const row = await tx.bookListing.create({
      data: { sellerId: userId, ...rest, priceBdt: rest.priceBdt ?? null },
    });
    await linkImages(app, tx, { listingId: row.id, userId, imageIds });
    return row.id;
  });

  return getListing(app, userId, id);
}

export async function updateListing(app, userId, id, input) {
  const { imageIds, ...rest } = input;

  const existing = await app.prisma.bookListing.findFirst({
    where: { id, sellerId: userId },
  });
  if (!existing) throw notFoundOrForbidden('Listing');

  // The price/type pairing must hold after the merge, not just within the
  // patch — changing type alone can otherwise leave a stale price behind.
  const nextType = rest.listingType ?? existing.listingType;
  const nextPrice = rest.priceBdt !== undefined ? rest.priceBdt : existing.priceBdt;
  if (nextType === 'SALE' ? nextPrice == null : nextPrice != null) {
    throw new BadRequestError(
      'A price is required for sale listings and must be omitted otherwise',
    );
  }

  await app.prisma.$transaction(async (tx) => {
    await tx.bookListing.update({
      where: { id },
      data: { ...rest, priceBdt: nextPrice },
    });
    if (imageIds) {
      await tx.bookImage.deleteMany({ where: { listingId: id } });
      await linkImages(app, tx, { listingId: id, userId, imageIds });
    }
  });

  return getListing(app, userId, id);
}

export async function deleteListing(app, userId, id) {
  const { count } = await app.prisma.bookListing.deleteMany({
    where: { id, sellerId: userId },
  });
  if (count === 0) throw notFoundOrForbidden('Listing');
}

// --- Bookmarks --------------------------------------------------------------

export async function addBookmark(app, userId, listingId) {
  const listing = await app.prisma.bookListing.count({
    where: { id: listingId, status: 'ACTIVE' },
  });
  if (listing === 0) throw new NotFoundError('Listing not found');

  // Idempotent: saving twice is not an error, it is a double tap.
  await app.prisma.bookmark.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: {},
  });
}

export async function removeBookmark(app, userId, listingId) {
  await app.prisma.bookmark.deleteMany({ where: { userId, listingId } });
}

// --- Conversations ----------------------------------------------------------

function toConversationResponse(row, viewerId, unreadCount) {
  const counterparty = row.buyerId === viewerId ? row.seller : row.buyer;
  return {
    id: row.id,
    listingId: row.listingId,
    listingTitle: row.listing?.title ?? null,
    counterparty: {
      id: counterparty.id,
      name: counterparty.name,
      department: counterparty.department,
    },
    lastMessageAt: row.lastMessageAt,
    unreadCount,
  };
}

const participantSelect = { select: { id: true, name: true, department: true } };

export async function listConversations(app, viewerId, query) {
  const rows = await app.prisma.conversation.findMany({
    // The participant filter IS the authorisation check.
    where: { OR: [{ buyerId: viewerId }, { sellerId: viewerId }] },
    orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
    include: {
      buyer: participantSelect,
      seller: participantSelect,
      listing: { select: { title: true } },
    },
    ...toPrismaPage(query),
  });

  const page = toPage(rows, query.limit);

  const unread = await app.prisma.message.groupBy({
    by: ['conversationId'],
    where: {
      conversationId: { in: page.items.map((c) => c.id) },
      readAt: null,
      senderId: { not: viewerId },
    },
    _count: { _all: true },
  });
  const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));

  return {
    ...page,
    items: page.items.map((row) =>
      toConversationResponse(row, viewerId, unreadMap.get(row.id) ?? 0),
    ),
  };
}

/** Open (or reuse) the thread between a buyer and a listing's seller. */
export async function startConversation(app, viewerId, { listingId }) {
  const listing = await app.prisma.bookListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status === 'REMOVED') throw new NotFoundError('Listing not found');
  if (listing.sellerId === viewerId) {
    throw new ConflictError('You cannot start a conversation on your own listing');
  }

  const conversation = await app.prisma.conversation.upsert({
    // The unique (listingId, buyerId) pair is what stops a thread forking each
    // time the buyer reopens the chat.
    where: { listingId_buyerId: { listingId, buyerId: viewerId } },
    create: { listingId, buyerId: viewerId, sellerId: listing.sellerId },
    update: {},
    include: {
      buyer: participantSelect,
      seller: participantSelect,
      listing: { select: { title: true } },
    },
  });

  return toConversationResponse(conversation, viewerId, 0);
}

/** Load a conversation, asserting the caller is one of its two participants. */
async function assertParticipant(app, viewerId, conversationId) {
  const conversation = await app.prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ buyerId: viewerId }, { sellerId: viewerId }],
    },
  });
  if (!conversation) throw notFoundOrForbidden('Conversation');
  return conversation;
}

export async function listMessages(app, viewerId, conversationId, query) {
  await assertParticipant(app, viewerId, conversationId);

  const rows = await app.prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    ...toPrismaPage(query),
  });

  const page = toPage(rows, query.limit);
  return {
    ...page,
    items: page.items.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      isMine: m.senderId === viewerId,
      readAt: m.readAt,
      createdAt: m.createdAt,
    })),
  };
}

export async function sendMessage(app, viewerId, conversationId, input) {
  await assertParticipant(app, viewerId, conversationId);

  const [message] = await app.prisma.$transaction([
    app.prisma.message.create({
      data: { conversationId, senderId: viewerId, body: input.body },
    }),
    // Keeps the inbox ordering correct without querying the messages table.
    app.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return {
    id: message.id,
    body: message.body,
    senderId: message.senderId,
    isMine: true,
    readAt: message.readAt,
    createdAt: message.createdAt,
  };
}

export async function markConversationRead(app, viewerId, conversationId) {
  await assertParticipant(app, viewerId, conversationId);
  // Only the other party's messages get marked — you cannot "read" your own.
  await app.prisma.message.updateMany({
    where: { conversationId, senderId: { not: viewerId }, readAt: null },
    data: { readAt: new Date() },
  });
}

// --- Reviews ---------------------------------------------------------------

export async function listSellerReviews(app, sellerId, query) {
  const rows = await app.prisma.sellerReview.findMany({
    where: { sellerId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: { rater: { select: { name: true } } },
    ...toPrismaPage(query),
  });

  const page = toPage(rows, query.limit);
  return {
    ...page,
    items: page.items.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      raterName: r.rater.name,
      createdAt: r.createdAt,
    })),
  };
}

export async function createReview(app, viewerId, sellerId, input) {
  const listing = await app.prisma.bookListing.findUnique({
    where: { id: input.listingId },
  });
  if (!listing || listing.sellerId !== sellerId) {
    throw new NotFoundError('Listing not found for this seller');
  }
  // Also enforced by a CHECK constraint; caught here for a friendlier message.
  if (sellerId === viewerId) {
    throw new ConflictError('You cannot review yourself');
  }

  const review = await app.prisma.sellerReview.upsert({
    // One review per rater per listing — re-submitting edits rather than stuffs.
    where: { raterId_listingId: { raterId: viewerId, listingId: input.listingId } },
    create: {
      sellerId,
      raterId: viewerId,
      listingId: input.listingId,
      rating: input.rating,
      comment: input.comment,
    },
    update: { rating: input.rating, comment: input.comment },
    include: { rater: { select: { name: true } } },
  });

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    raterName: review.rater.name,
    createdAt: review.createdAt,
  };
}

/** Backs the dashboard's "N listings" chip. */
export async function countActiveListings(app) {
  return app.prisma.bookListing.count({ where: { status: 'ACTIVE' } });
}
