import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ApiError } from '../api/errors';
import { useAuth, authErrorMessage } from './AuthContext';
import { useResendCooldown } from './useResendCooldown';

/**
 * Two-step password reset on one screen.
 *
 * Step 1 captures the emailed code; step 2 the new password. Only the final
 * submit talks to the server — there is no OTP-only endpoint — so a code
 * failure bounces the user back to step 1 rather than leaving them stranded
 * on the password form. Password policy is enforced server-side and surfaced
 * through the same per-field error mechanism Register uses.
 */
export function useResetPasswordViewModel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { forgotPassword, resetPassword } = useAuth();
  const { secondsLeft, canSend, start } = useResendCooldown();

  const email = (location.state as { email?: string } | null)?.email ?? '';
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // A code was just issued on the forgot-password screen, so the resend is
  // gated by the cooldown from the moment this screen mounts.
  useEffect(() => {
    start();
  }, [start]);

  function next(): boolean {
    if (otp.length !== 6) {
      setMessage('Enter the 6-digit code sent to your email.');
      return false;
    }
    setMessage(null);
    setStep('password');
    return true;
  }

  function backToOtp() {
    setStep('otp');
    setMessage(null);
  }

  async function submit(): Promise<boolean> {
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in all fields.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return false;
    }
    setIsLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      navigate('/login', { replace: true });
      return true;
    } catch (error) {
      const isOtpFailure =
        error instanceof ApiError && (error.isUnauthorized || error.isForbidden);
      if (isOtpFailure) {
        // Wrong or locked code — let them correct it or ask for a fresh one.
        setStep('otp');
        setOtp('');
        setMessage(authErrorMessage(error));
      } else {
        // Password-policy or network failure — stay on the password step.
        const fieldError = error instanceof ApiError ? error.errorFor('newPassword') : undefined;
        setMessage(fieldError ?? authErrorMessage(error));
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function resend(): Promise<boolean> {
    setIsResending(true);
    try {
      // Re-issuing a reset code is exactly what /forgot-password does — it
      // supersedes the old code and emails a fresh one.
      await forgotPassword(email);
      setStep('otp');
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
    step,
    otp,
    setOtp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    isResending,
    message,
    secondsLeft,
    canSend,
    next,
    backToOtp,
    submit,
    resend,
    clearMessage,
  };
}