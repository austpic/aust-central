import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setLoggedIn } from '../utils/auth';

// Mirrors RegisterPage in lib/register_page.dart (mock auth).
export function useRegisterViewModel() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function register() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setMessage('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setLoggedIn(true);
      setMessage('Account created successfully!');
      navigate('/home', { replace: true });
    }, 600);
  }

  function clearMessage() {
    if (message) setMessage(null);
  }

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    message,
    register,
    clearMessage,
  };
}
