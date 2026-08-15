import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setLoggedIn } from '../utils/auth';

// Mirrors LoginScreen in lib/login_page.dart (minus the Firebase plumbing —
// mock auth: any non-empty email/password signs in).
export function useLoginViewModel() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function login() {
    if (!email.trim() || !password.trim()) {
      setMessage('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setLoggedIn(true);
      navigate('/home', { replace: true });
    }, 600);
  }

  function forgotPassword() {
    if (!email.trim()) {
      setMessage('Enter your email above to reset your password.');
      return;
    }
    setMessage(`Password reset email sent to ${email.trim()}.`);
  }

  function clearMessage() {
    if (message) setMessage(null);
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    message,
    login,
    forgotPassword,
    clearMessage,
  };
}
