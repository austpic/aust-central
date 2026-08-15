import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth, authErrorMessage } from './AuthContext';

// Mirrors LoginScreen in lib/views/auth/login_page.dart — real auth against
// the API, replacing the previous mock (any non-empty email/password).
export function useLoginViewModel() {
  const navigate = useNavigate();
  const { login, forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password.trim()) {
      setMessage('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/home', { replace: true });
    } catch (error) {
      setMessage(authErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function requestPasswordReset() {
    if (!email.trim()) {
      setMessage('Enter your email above to reset your password.');
      return;
    }
    try {
      await forgotPassword(email.trim());
      // Phrased to match the server, which deliberately answers the same way
      // whether or not the address has an account — see forgotPassword in
      // the API. This is not a display bug; it is the point.
      setMessage('If that email has an account, a reset link is on its way.');
    } catch (error) {
      setMessage(authErrorMessage(error));
    }
  }

  function clearMessage() {
    if (message) setMessage(null);
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    message,
    login: submit,
    forgotPassword: requestPasswordReset,
    clearMessage,
  };
}
