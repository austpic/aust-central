import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';
import { useToast } from '../components/Toast';
import { useVerifyEmailViewModel } from '../viewmodels/useVerifyEmailViewModel';

// The post-registration stop: enter the 6-digit code emailed at signup.
// Reuses AuthLayout and the auth-form button/error/toast conventions exactly,
// so the screen is indistinguishable from Login/Register in spacing, type,
// and states.
export default function VerifyEmailView() {
  const toast = useToast();
  const vm = useVerifyEmailViewModel();

  useEffect(() => {
    if (vm.message) {
      toast(vm.message, 'error');
      vm.clearMessage();
    }
  }, [vm, vm.message, toast]);

  async function handleVerify() {
    const ok = await vm.verify();
    if (ok) toast('Email verified. Welcome to AUST Central!', 'success');
  }

  async function handleResend() {
    const sent = await vm.resend();
    if (sent) toast('A new code is on its way.', 'success');
  }

  if (!vm.email) {
    // No email was carried over (deep link / refresh on the page).
    return <Navigate to="/register" replace />;
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${vm.email}. Enter it below to activate your account.`}
    >
      <div className="mt-8 space-y-5">
        <OtpInput
          value={vm.otp}
          onChange={vm.setOtp}
          disabled={vm.isLoading || vm.isResending}
          autoFocus
        />
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={vm.isLoading || vm.isResending}
        className="glass-accent glass-sheen mt-8 flex h-[54px] w-full items-center justify-center gap-2 rounded-[15px] text-[17px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg disabled:opacity-70"
      >
        {vm.isLoading ? <Loader2 size={22} className="animate-spin" /> : 'Verify Email'}
        {!vm.isLoading && <ArrowRight size={20} />}
      </button>

      <div className="mt-8 text-center text-[14px] text-dim">
        Didn&apos;t get the code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={!vm.canSend || vm.isResending}
          className="font-bold text-primary hover:underline disabled:opacity-50"
        >
          {vm.isResending
            ? 'Sending…'
            : vm.canSend
              ? 'Resend code'
              : `Resend code in ${vm.secondsLeft}s`}
        </button>
      </div>

      <div className="mt-6 text-center text-[14px] text-dim">
        <Link to="/login" className="font-bold text-primary hover:underline">
          Sign in with a different account
        </Link>
      </div>
    </AuthLayout>
  );
}