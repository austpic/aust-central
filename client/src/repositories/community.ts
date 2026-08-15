import { apiClient } from '../api/client';

/**
 * Notices, blood bank, lost & found, and the book exchange.
 * Mirrors lib/data/repositories/community_repository.dart.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export const communityRepository = {
  // --- Notices -------------------------------------------------------------
  listNotices: (category?: string, search?: string): Promise<{ items: Json[] }> =>
    apiClient.get('/notices', { category, search, limit: 50 }),

  latestNotice: (): Promise<Json | null> => apiClient.get('/notices/latest'),

  // --- Blood bank ------------------------------------------------------
  // Includes server-computed eligibility — the 90-day rule lives there, so
  // the client renders the answer instead of deriving its own.
  donorProfile: (): Promise<Json> => apiClient.get('/blood/donor-profile'),

  updateDonorProfile: (
    input: Partial<{ available: boolean; bloodGroup: string; lastDonated: string }>,
  ): Promise<Json> => apiClient.put('/blood/donor-profile', input),

  bloodRequests: (status = 'OPEN', bloodGroup?: string, mine = false): Promise<{ items: Json[] }> =>
    apiClient.get('/blood/requests', { status, bloodGroup, mine, limit: 50 }),

  createBloodRequest: (input: {
    patientName: string;
    bloodGroup: string;
    hospital: string;
    location?: string;
    units: number;
    urgency: string;
    requiredBy: string;
    contactNumber: string;
    notes?: string;
  }): Promise<Json> => apiClient.post('/blood/requests', input),

  setBloodRequestStatus: (id: string, status: string): Promise<Json> =>
    apiClient.patch(`/blood/requests/${id}`, { status }),

  // --- Lost & found ----------------------------------------------------
  lostFoundItems: (
    search?: string,
    category?: string,
    kind?: string,
    mine = false,
  ): Promise<{ items: Json[] }> =>
    apiClient.get('/lost-found', { search, category, kind, mine, limit: 50 }),

  lostFoundCategories: (): Promise<string[]> => apiClient.get('/lost-found/categories'),

  reportLostFound: (input: {
    name: string;
    kind: string;
    category: string;
    occurredOn: string;
    color?: string;
    room?: string;
    description?: string;
    imageIds?: string[];
  }): Promise<Json> => apiClient.post('/lost-found', input),

  // --- Book exchange -----------------------------------------------------
  listings: (
    tab = 'browse',
    sort = 'recent',
    search?: string,
    department?: string,
    courseCode?: string,
  ): Promise<{ items: Json[] }> =>
    apiClient.get('/books/listings', { tab, sort, search, department, courseCode, limit: 50 }),

  listing: (id: string): Promise<Json> => apiClient.get(`/books/listings/${id}`),

  createListing: (input: {
    title: string;
    courseCode: string;
    department: string;
    semester: string;
    condition: string;
    listingType: string;
    priceBdt?: number | null;
    description?: string;
    imageIds?: string[];
  }): Promise<Json> => apiClient.post('/books/listings', input),

  updateListing: (id: string, input: Partial<Record<string, unknown>>): Promise<Json> =>
    apiClient.patch(`/books/listings/${id}`, input),

  deleteListing: (id: string): Promise<void> => apiClient.delete(`/books/listings/${id}`),

  setBookmark: (listingId: string, saved: boolean): Promise<void> =>
    saved
      ? apiClient.put(`/books/listings/${listingId}/bookmark`)
      : apiClient.delete(`/books/listings/${listingId}/bookmark`),

  conversations: (): Promise<{ items: Json[] }> =>
    apiClient.get('/books/conversations', { limit: 50 }),

  startConversation: (listingId: string): Promise<Json> =>
    apiClient.post('/books/conversations', { listingId }),

  messages: (conversationId: string): Promise<{ items: Json[] }> =>
    apiClient.get(`/books/conversations/${conversationId}/messages`, { limit: 50 }),

  sendMessage: (conversationId: string, body: string): Promise<Json> =>
    apiClient.post(`/books/conversations/${conversationId}/messages`, { body }),

  markConversationRead: (conversationId: string): Promise<void> =>
    apiClient.post(`/books/conversations/${conversationId}/read`),

  sellerReviews: (sellerId: string): Promise<{ items: Json[] }> =>
    apiClient.get(`/books/sellers/${sellerId}/reviews`, { limit: 50 }),

  createReview: (
    sellerId: string,
    input: { listingId: string; rating: number; comment?: string },
  ): Promise<Json> => apiClient.post(`/books/sellers/${sellerId}/reviews`, input),
};
