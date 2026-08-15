import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClassReminderViewModel } from './useClassReminderViewModel';
import { academicRepository } from '../repositories/academic';
import { ApiError } from '../api/errors';

/**
 * Mirrors mobile/aust-central/test/viewmodels/class_reminder_view_model_test.dart
 * — same view model contract, same behaviors, verified independently on
 * this side of the shared backend with a mocked repository instead of a
 * fake Dart class.
 */
vi.mock('../repositories/academic', () => ({
  academicRepository: {
    listClassReminders: vi.fn(),
    updateClassReminder: vi.fn(),
    createClassReminder: vi.fn(),
    addAssessment: vi.fn(),
    deleteClassReminder: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(academicRepository);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useClassReminderViewModel', () => {
  it('loads reminders and converts server time formats for display', async () => {
    mockedRepo.listClassReminders.mockResolvedValue([
      {
        id: 'r1',
        courseName: 'Database Systems',
        weekday: 'TUESDAY',
        classTime: '13:00',
        isEnabled: true,
        minutesBefore: 15,
        assessments: [],
      },
    ]);

    const { result } = renderHook(() => useClassReminderViewModel());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.reminders).toHaveLength(1);
    expect(result.current.reminders[0].weekday).toBe('Tuesday');
    expect(result.current.reminders[0].classTime).toBe('1:00 PM');
    expect(result.current.enabledCount).toBe(1);
  });

  it('surfaces a load failure as an error message', async () => {
    mockedRepo.listClassReminders.mockRejectedValue(
      new ApiError({ message: 'Session expired', status: 401 }),
    );

    const { result } = renderHook(() => useClassReminderViewModel());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Session expired');
  });

  it('toggleReminder is optimistic and rolls back on failure', async () => {
    mockedRepo.listClassReminders.mockResolvedValue([
      {
        id: 'r1',
        courseName: 'Physics Lab',
        weekday: 'MONDAY',
        classTime: '17:00',
        isEnabled: true,
        minutesBefore: 10,
        assessments: [],
      },
    ]);
    mockedRepo.updateClassReminder.mockRejectedValue(
      new ApiError({ message: 'Could not save' }),
    );

    const { result } = renderHook(() => useClassReminderViewModel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleReminder(0);
    });

    expect(result.current.reminders[0].isEnabled).toBe(true);
    expect(result.current.error).toBe('Could not save');
  });

  it('addReminder reloads from the server rather than inserting locally', async () => {
    mockedRepo.listClassReminders
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'r1',
          courseName: 'Operating Systems',
          weekday: 'WEDNESDAY',
          classTime: '10:00',
          isEnabled: true,
          minutesBefore: 10,
          assessments: [],
        },
      ]);
    mockedRepo.createClassReminder.mockResolvedValue({ id: 'r1' });

    const { result } = renderHook(() => useClassReminderViewModel());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addReminder('Operating Systems', 'Wednesday', '10:00 AM');
    });

    expect(mockedRepo.listClassReminders).toHaveBeenCalledTimes(2);
    expect(result.current.reminders).toHaveLength(1);
    expect(result.current.reminders[0].courseName).toBe('Operating Systems');
  });
});
