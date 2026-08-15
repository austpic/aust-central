import { apiClient } from '../api/client';

/**
 * Tasks, class reminders, CGPA, and lab report drafts.
 *
 * Mirrors lib/data/repositories/academic_repository.dart method-for-method —
 * same endpoints, same shapes. Repositories return plain objects rather than
 * re-deriving a TS type for every endpoint; the server response is already the
 * contract, and view models map at their own edge where a stronger type helps.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export const academicRepository = {
  // --- Tasks -----------------------------------------------------------
  listTasks: (filter = 'all', search?: string): Promise<{ items: Json[] }> =>
    apiClient.get('/tasks', { filter, search, limit: 100 }),

  createTask: (input: {
    title: string;
    note?: string;
    category?: string;
    dueDate?: string | null;
  }): Promise<Json> => apiClient.post('/tasks', input),

  updateTask: (
    id: string,
    input: Partial<{
      title: string;
      note: string;
      category: string;
      isDone: boolean;
      dueDate: string | null;
    }>,
  ): Promise<Json> => apiClient.patch(`/tasks/${id}`, input),

  deleteTask: (id: string): Promise<void> => apiClient.delete(`/tasks/${id}`),

  // --- Class reminders ---------------------------------------------------
  listClassReminders: (): Promise<Json[]> => apiClient.get('/class-reminders'),

  nextClass: (): Promise<Json | null> => apiClient.get('/class-reminders/next'),

  createClassReminder: (input: {
    courseName: string;
    weekday: string;
    classTime: string;
    isEnabled?: boolean;
    minutesBefore?: number;
  }): Promise<Json> => apiClient.post('/class-reminders', input),

  updateClassReminder: (
    id: string,
    input: Partial<{
      isEnabled: boolean;
      minutesBefore: number;
      courseName: string;
      weekday: string;
      classTime: string;
    }>,
  ): Promise<Json> => apiClient.patch(`/class-reminders/${id}`, input),

  deleteClassReminder: (id: string): Promise<void> =>
    apiClient.delete(`/class-reminders/${id}`),

  addAssessment: (
    reminderId: string,
    input: { type: string; dateTime: string },
  ): Promise<Json> => apiClient.post(`/class-reminders/${reminderId}/assessments`, input),

  deleteAssessment: (reminderId: string, assessmentId: string): Promise<void> =>
    apiClient.delete(`/class-reminders/${reminderId}/assessments/${assessmentId}`),

  // --- CGPA ----------------------------------------------------------------
  cgpaSummary: (): Promise<Json> => apiClient.get('/cgpa/summary'),

  createSemester: (name: string): Promise<Json> =>
    apiClient.post('/cgpa/semesters', { name }),

  deleteSemester: (id: string): Promise<void> =>
    apiClient.delete(`/cgpa/semesters/${id}`),

  addCourse: (
    semesterId: string,
    input: { courseName: string; credits: number; grade: string },
  ): Promise<Json> => apiClient.post(`/cgpa/semesters/${semesterId}/courses`, input),

  updateCourse: (
    semesterId: string,
    courseId: string,
    input: Partial<{ courseName: string; credits: number; grade: string }>,
  ): Promise<Json> =>
    apiClient.patch(`/cgpa/semesters/${semesterId}/courses/${courseId}`, input),

  deleteCourse: (semesterId: string, courseId: string): Promise<void> =>
    apiClient.delete(`/cgpa/semesters/${semesterId}/courses/${courseId}`),

  whatIf: (courses: { credits: number; grade: string }[]): Promise<Json> =>
    apiClient.post('/cgpa/what-if', { courses }),

  // --- Lab report drafts ---------------------------------------------------
  listLabReports: (): Promise<{ items: Json[] }> =>
    apiClient.get('/lab-reports', { limit: 50 }),

  saveLabReport: (fields: Record<string, string>, id?: string): Promise<Json> =>
    id ? apiClient.patch(`/lab-reports/${id}`, fields) : apiClient.post('/lab-reports', fields),

  deleteLabReport: (id: string): Promise<void> => apiClient.delete(`/lab-reports/${id}`),
};
