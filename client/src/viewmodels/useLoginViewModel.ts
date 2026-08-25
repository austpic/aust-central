import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth, authErrorMessage } from './AuthContext';

// Mirrors LoginScreen in lib/views/auth/login_page.dart — real auth against
// the API, replacing the previous mock (any non-empty email/password).
export function useLoginViewModel() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
    clearMessage,
  };
}
