import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../viewmodels/AuthContext';
import { useVerifyEmailViewModel } from '../viewmodels/useVerifyEmailViewModel';

// Target of the verification email link. Verifies on arrival.
export default function VerifyEmailView() {
  const vm = useVerifyEmailViewModel();
  const { isSignedIn } = useAuth();
  const next = isSignedIn ? { to: '/home', label: 'Continue to AUST Central' } : { to: '/login', label: 'Sign in' };

  if (vm.status === 'verifying') {
    return (
      <AuthLayout title="Verifying your email" subtitle="One moment…">
        <Loader2 size={28} className="mt-8 animate-spin text-primary" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={vm.status === 'verified' ? 'Email verified' : 'Link not valid'}
      subtitle={
        vm.status === 'verified'
          ? 'Thanks — your AUST Central address is confirmed.'
          : vm.message
      }
    >
      <Link to={next.to} className="mt-8 inline-block font-bold text-primary hover:underline">
        {next.label}
      </Link>
    </AuthLayout>
  );
}
