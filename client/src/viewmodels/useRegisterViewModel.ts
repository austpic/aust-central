import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth, authErrorMessage } from './AuthContext';
import { ApiError } from '../api/errors';

// Mirrors RegisterPage in lib/views/auth/register_page.dart — real auth
// against the API. The server enforces a stronger password policy (≥10
// chars, mixed case, a digit) than this screen's old 6-character check, and
// returns per-field messages on failure.
export function useRegisterViewModel() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setMessage('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/verify-email', { replace: true, state: { email: email.trim() } });
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
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    message,
    register: submit,
    clearMessage,
  };
}
