import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Lock, ArrowRight } from 'lucide-react';
import Field from '../components/Field';
import AuthLayout from '../components/AuthLayout';
import { useToast } from '../components/Toast';
import { useResetPasswordViewModel } from '../viewmodels/useResetPasswordViewModel';

// Target of the password-reset email link. Same auth shell as Login/Register.
export default function ResetPasswordView() {
  const toast = useToast();
  const navigate = useNavigate();
  const vm = useResetPasswordViewModel();

  useEffect(() => {
    if (vm.message) {
      toast(vm.message, 'error');
      vm.clearMessage();
    }
  }, [vm, vm.message, toast]);

  useEffect(() => {
    if (vm.done) {
      toast('Password updated. Sign in with your new password.', 'success');
      navigate('/login', { replace: true });
    }
  }, [vm.done, toast, navigate]);

  if (!vm.hasToken) {
    return (
      <AuthLayout
        title="Link not valid"
        subtitle="This reset link is incomplete. Request a new one from the sign-in page."
      >
        <Link
          to="/login"
          className="mt-8 inline-block font-bold text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="At least 10 characters, with upper and lower case letters and a digit. Every signed-in device will be signed out."
    >
      <div className="mt-8 space-y-5">
        <Field
          label="New Password"
          icon={<Lock size={18} />}
          value={vm.password}
          onChange={(e) => vm.setPassword(e.target.value)}
          placeholder="Enter a new password"
          type="password"
          autoComplete="new-password"
        />
        <Field
          label="Confirm Password"
          icon={<Lock size={18} />}
          value={vm.confirmPassword}
          onChange={(e) => vm.setConfirmPassword(e.target.value)}
          placeholder="Re-enter the new password"
          type="password"
          autoComplete="new-password"
        />
      </div>

      <button
        type="button"
        onClick={vm.submit}
        disabled={vm.isLoading}
        className="glass-accent glass-sheen mt-8 flex h-[54px] w-full items-center justify-center gap-2 rounded-[15px] text-[17px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg disabled:opacity-70"
      >
        {vm.isLoading ? <Loader2 size={22} className="animate-spin" /> : 'Update Password'}
        {!vm.isLoading && <ArrowRight size={20} />}
      </button>

      <div className="mt-6 text-center text-[14px] text-dim">
        Remembered it?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
