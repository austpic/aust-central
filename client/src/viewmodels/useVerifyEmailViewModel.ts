import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth, authErrorMessage } from './AuthContext';
import { useResendCooldown } from './useResendCooldown';

/**
 * Verify-email screen behaviour: takes the address registered moments ago
 * (carried over via router state), submits the emailed code, and — because
 * registration already returned a session — lands the user in the app on
 * success.
 */
export function useVerifyEmailViewModel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerification } = useAuth();
  const { secondsLeft, canSend, start } = useResendCooldown();

  const email = (location.state as { email?: string } | null)?.email ?? '';
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // A code was just issued at registration, so the resend is gated by the
  // cooldown from the moment the screen mounts.
  useEffect(() => {
    start();
  }, [start]);

  async function verify(): Promise<boolean> {
    if (otp.length !== 6) {
      setMessage('Enter the 6-digit code sent to your email.');
      return false;
    }
    setIsLoading(true);
    try {
      await verifyEmail(email, otp);
      navigate('/home', { replace: true });
      return true;
    } catch (error) {
      setMessage(authErrorMessage(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function resend(): Promise<boolean> {
    setIsResending(true);
    try {
      await resendVerification(email);
      setOtp('');
      start();
      return true;
    } catch (error) {
      setMessage(authErrorMessage(error));
      return false;
    } finally {
      setIsResending(false);
    }
  }

  function clearMessage() {
    if (message) setMessage(null);
  }

  return {
    email,
    otp,
    setOtp,
    isLoading,
    isResending,
    message,
    secondsLeft,
    canSend,
    verify,
    resend,
    clearMessage,
  };
}