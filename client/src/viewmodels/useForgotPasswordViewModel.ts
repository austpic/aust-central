import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth, authErrorMessage } from './AuthContext';

/**
 * Forgot-password screen behaviour: ask for the address, ask the server to
 * issue a code, then hand off to the reset screen with the email carried in
 * router state. The server replies identically whether or not the address has
 * an account, so no path here distinguishes the two.
 */
export function useForgotPasswordViewModel() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(): Promise<boolean> {
    if (!email.trim()) {
      setMessage('Enter your email address.');
      return false;
    }
    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      navigate('/reset-password', { state: { email: email.trim() } });
      return true;
    } catch (error) {
      setMessage(authErrorMessage(error));
      return false;
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
    isLoading,
    message,
    submit,
    clearMessage,
  };
}