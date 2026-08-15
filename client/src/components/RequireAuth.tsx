import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../viewmodels/AuthContext';

/**
 * Route guard for the app shell.
 *
 * Mirrors SplashScreen's auth gate in lib/views/auth/splash_screen.dart: wait
 * for session restoration, then either render the protected route or bounce
 * to /login. `isRestoring` covers the one refresh + /me round trip on first
 * load — rendering nothing during it avoids a flash of the login screen for a
 * user who is actually still signed in.
 */
export default function RequireAuth() {
  const { isSignedIn, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) return null;

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
