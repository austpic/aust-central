import { useNavigate } from 'react-router-dom';

// Mirrors WelcomeScreen in lib/welcome_screen.dart
export function useWelcomeViewModel() {
  const navigate = useNavigate();

  function goToLogin() {
    navigate('/login');
  }

  return { goToLogin };
}
