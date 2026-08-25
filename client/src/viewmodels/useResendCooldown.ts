import { useCallback, useEffect, useState } from 'react';

const DEFAULT_COOLDOWN_SECONDS = 45;

/**
 * Disable a "resend code" action for a short window after each send.
 * Shared by the verify-email and reset-password screens so both resend
 * buttons behave identically and the code is not re-issued on demand.
 */
export function useResendCooldown(seconds = DEFAULT_COOLDOWN_SECONDS) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const start = useCallback(() => setSecondsLeft(seconds), [seconds]);

  return { secondsLeft, canSend: secondsLeft === 0, start };
}