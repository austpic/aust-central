import { apiClient } from '../api/client';

/**
 * Dashboard, profile, transport, notifications, and file uploads.
 * Mirrors lib/data/repositories/platform_repository.dart.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export const platformRepository = {
  /** Every counter the home dashboard shows, in one round trip. */
  dashboard: (): Promise<Json> => apiClient.get('/me/dashboard'),

  profile: (): Promise<Json> => apiClient.get('/me'),

  updateProfile: (
    input: Partial<{ name: string; studentId: string; department: string }>,
  ): Promise<Json> => apiClient.patch('/me', input),

  setAvatarFromFile: async (file: File): Promise<Json> => {
    const uploaded = await apiClient.uploadFile<{ id: string }>('/files', file);
    return apiClient.put('/me/avatar', { fileId: uploaded.id });
  },

  uploadImage: async (file: File): Promise<string> => {
    const uploaded = await apiClient.uploadFile<{ id: string }>('/files', file);
    return uploaded.id;
  },

  // --- Transport -----------------------------------------------------------
  stops: (): Promise<Json[]> => apiClient.get('/transport/stops'),

  buses: (): Promise<Json[]> => apiClient.get('/transport/buses'),

  departures: (fromStopId?: string, toStopId?: string, date?: string): Promise<Json[]> =>
    apiClient.get('/transport/departures', { from: fromStopId, to: toStopId, date }),

  // --- Notifications ---------------------------------------------------
  notifications: (unreadOnly = false, type?: string): Promise<{ items: Json[] }> =>
    apiClient.get('/notifications', { unreadOnly, type, limit: 50 }),

  unreadCount: (): Promise<number> =>
    apiClient.get<{ count: number }>('/notifications/unread-count').then((r) => r.count),

  markRead: (id: string): Promise<void> => apiClient.post(`/notifications/${id}/read`),

  markAllRead: (): Promise<void> => apiClient.post('/notifications/read-all'),
};
