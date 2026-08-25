import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, ArrowRight } from 'lucide-react';
import Field from '../components/Field';
import AuthLayout from '../components/AuthLayout';
import { useToast } from '../components/Toast';
import { useForgotPasswordViewModel } from '../viewmodels/useForgotPasswordViewModel';

// The first leg of the OTP password reset: collect the address, issue the
// code, then move on to /reset-password with the email in router state.
// Styled identically to Login/Register (same AuthLayout, Field, button).
export default function ForgotPasswordView() {
  const toast = useToast();
  const vm = useForgotPasswordViewModel();

  useEffect(() => {
    if (vm.message) {
      toast(vm.message, 'error');
      vm.clearMessage();
    }
  }, [vm, vm.message, toast]);

  async function handleSubmit() {
    const ok = await vm.submit();
    if (ok) toast('If that email has an account, a reset code is on its way.', 'success');
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a 6-digit code to reset it."
    >
      <div className="mt-8 space-y-5">
        <Field
          label="Email"
          icon={<Mail size={18} />}
          value={vm.email}
          onChange={(e) => vm.setEmail(e.target.value)}
          placeholder="you@aust.edu"
          type="email"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={vm.isLoading}
        className="glass-accent glass-sheen mt-8 flex h-[54px] w-full items-center justify-center gap-2 rounded-[15px] text-[17px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg disabled:opacity-70"
      >
        {vm.isLoading ? <Loader2 size={22} className="animate-spin" /> : 'Send Reset Code'}
        {!vm.isLoading && <ArrowRight size={20} />}
      </button>

      <div className="mt-6 text-center text-[14px] text-dim">
        Remembered it?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}