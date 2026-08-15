// Minimal auth-state persistence for the mock auth flow. Login/register mark
// the user as signed in, sign-out clears it, and the public landing page reads
// it to show the signed-in UI (Home button) instead of Sign In / Get Started.
const AUTH_KEY = 'aust_central_auth';

export function isLoggedIn(): boolean {
  try {
    return localStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setLoggedIn(value: boolean): void {
  try {
    if (value) localStorage.setItem(AUTH_KEY, 'true');
    else localStorage.removeItem(AUTH_KEY);
  } catch {
    /* storage unavailable — ignore */
  }
}
