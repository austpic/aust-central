import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import appLogo from '../assets/app-logo.png';

// Mirrors SplashScreen in lib/splash_screen.dart — shows the logo for 3s,
// then replaces the route with the Welcome screen.
export function useSplashViewModel() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome', { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return { logo: appLogo };
}
