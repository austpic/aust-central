import { StrictMode, createElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../api/client';
import { ApiError } from '../api/errors';
import { useVerifyEmailViewModel } from './useVerifyEmailViewModel';
import { useResetPasswordViewModel } from './useResetPasswordViewModel';

/**
 * The two pages emailed links land on. Both carry a single-use token, which
 * is what these tests pin: it is spent exactly once and never left in the URL.
 */
vi.mock('../api/client', () => ({
  apiClient: { post: vi.fn() },
}));

const post = vi.mocked(apiClient.post);
const strict = ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children);

function landOn(url: string) {
  window.history.replaceState(null, '', url);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useVerifyEmailViewModel', () => {
  it('spends the token once, even under StrictMode, and strips it from the URL', async () => {
    landOn('/verify-email?token=abc123');
    post.mockResolvedValue({ message: 'Email verified.' });

    const { result } = renderHook(() => useVerifyEmailViewModel(), { wrapper: strict });

    await waitFor(() => expect(result.current.status).toBe('verified'));
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/auth/verify-email', { token: 'abc123' });
    expect(window.location.search).toBe('');
  });

  it('fails without a token and never calls the API', () => {
    landOn('/verify-email');
    const { result } = renderHook(() => useVerifyEmailViewModel());
    expect(result.current.status).toBe('failed');
    expect(post).not.toHaveBeenCalled();
  });
});

describe('useResetPasswordViewModel', () => {
  it('refuses mismatched passwords without calling the API', async () => {
    landOn('/reset-password?token=tok');
    const { result } = renderHook(() => useResetPasswordViewModel());

    act(() => {
      result.current.setPassword('CorrectHorse7');
      result.current.setConfirmPassword('CorrectHorse8');
    });
    await act(() => result.current.submit());

    expect(result.current.message).toBe('Passwords do not match.');
    expect(post).not.toHaveBeenCalled();
  });

  it('submits the token with the new password', async () => {
    landOn('/reset-password?token=tok');
    post.mockResolvedValue({ message: 'ok' });
    const { result } = renderHook(() => useResetPasswordViewModel());

    act(() => {
      result.current.setPassword('CorrectHorse7');
      result.current.setConfirmPassword('CorrectHorse7');
    });
    await act(() => result.current.submit());

    expect(post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'tok',
      password: 'CorrectHorse7',
    });
    expect(result.current.done).toBe(true);
  });

  it('surfaces the server message for an expired link', async () => {
    landOn('/reset-password?token=old');
    post.mockRejectedValue(
      new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'This reset link is invalid or has expired' }),
    );
    const { result } = renderHook(() => useResetPasswordViewModel());

    act(() => {
      result.current.setPassword('CorrectHorse7');
      result.current.setConfirmPassword('CorrectHorse7');
    });
    await act(() => result.current.submit());

    expect(result.current.message).toBe('This reset link is invalid or has expired');
    expect(result.current.done).toBe(false);
  });
});
