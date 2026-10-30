import { useState } from 'react';

// Reads the one-time `?token=` from an emailed link, then strips it from the
// address bar so it does not linger in history, get bookmarked, or leak to a
// later page through the Referer header.
export function useEmailedToken(): string | null {
  const [token] = useState(() => {
    const value = new URLSearchParams(window.location.search).get('token');
    if (value) window.history.replaceState(null, '', window.location.pathname);
    return value;
  });
  return token;
}
