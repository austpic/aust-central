import { useState } from 'react';

import { apiClient } from '../api/client';
import { ApiError } from '../api/errors';
import { authErrorMessage } from './AuthContext';
import { useEmailedToken } from './useEmailedToken';

// Landing page for the link in the password-reset email
// (`${APP_URL}/reset-password?token=…`, built in server/src/lib/mailer.js).
// The token is single-use and expires after 30 minutes; the server revokes
// every session on success, so the user signs in fresh afterwards.
export function useResetPasswordViewModel() {
  const token = useEmailedToken();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!password.trim() || !confirmPassword.trim()) {
      setMessage('Please fill in both fields.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (error) {
      const fieldError = error instanceof ApiError ? error.errorFor('password') : undefined;
      setMessage(fieldError ?? authErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function clearMessage() {
    if (message) setMessage(null);
  }

  return {
    hasToken: token !== null,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    message,
    done,
    submit,
    clearMessage,
  };
}
