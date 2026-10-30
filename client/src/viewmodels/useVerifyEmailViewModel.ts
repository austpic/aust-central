import { useEffect, useRef, useState } from 'react';

import { apiClient } from '../api/client';
import { authErrorMessage } from './AuthContext';
import { useEmailedToken } from './useEmailedToken';

export type VerifyStatus = 'verifying' | 'verified' | 'failed';

// Landing page for the link in the verification email
// (`${APP_URL}/verify-email?token=…`). Verifies on arrival — there is nothing
// for the user to fill in.
export function useVerifyEmailViewModel() {
  const token = useEmailedToken();
  const [status, setStatus] = useState<VerifyStatus>(token ? 'verifying' : 'failed');
  const [message, setMessage] = useState<string>(
    token ? '' : 'This verification link is missing its token.',
  );
  // The token is single-use: StrictMode's double-invoked effect would spend
  // it on the first call and report the second as "invalid or expired".
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    apiClient
      .post('/auth/verify-email', { token })
      .then(() => setStatus('verified'))
      .catch((error: unknown) => {
        setStatus('failed');
        setMessage(authErrorMessage(error));
      });
  }, [token]);

  return { status, message };
}
