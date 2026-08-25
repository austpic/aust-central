import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, Lock, ArrowRight } from 'lucide-react';
import Field from '../components/Field';
import OtpInput from '../components/OtpInput';
import AuthLayout from '../components/AuthLayout';
import { useToast } from '../components/Toast';
import { useResetPasswordViewModel } from '../viewmodels/useResetPasswordViewModel';

// Two-step password reset on one screen: enter the emailed 6-digit code,
// then the new password. Same AuthLayout, fields, button, and toast/error
// conventions as Login/Register — only the step state differs.
export default function ResetPasswordView() {
  const toast = useToast();
  const vm = useResetPasswordViewModel();

  useEffect(() => {
    if (vm.message) {
      toast(vm.message, 'error');
      vm.clearMessage();
    }
  }, [vm, vm.message, toast]);

  async function handleSubmit() {
    const ok = await vm.submit();
    if (ok) toast('Password updated. Please sign in with your new password.', 'success');
  }

  async function handleResend() {
    const sent = await vm.resend();
    if (sent) toast('A new code is on its way.', 'success');
  }

  if (!vm.email) {
    // No email was carried over (deep link / refresh on the page).
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <AuthLayout
      title={vm.step === 'otp' ? 'Enter the code' : 'Choose a new password'}
      subtitle={
        vm.step === 'otp'
          ? `We sent a 6-digit code to ${vm.email}.`
          : `Setting a new password for ${vm.email}.`
      }
    >
      {vm.step === 'otp' ? (
        <>
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
            onClick={vm.next}
            disabled={vm.isResending}
            className="glass-accent glass-sheen mt-8 flex h-[54px] w-full items-center justify-center gap-2 rounded-[15px] text-[17px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg disabled:opacity-70"
          >
            Continue
            <ArrowRight size={20} />
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
        </>
      ) : (
        <>
          <div className="mt-8 space-y-5">
            <Field
              label="New Password"
              icon={<Lock size={18} />}
              value={vm.newPassword}
              onChange={(e) => vm.setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              type="password"
            />
            <Field
              label="Confirm New Password"
              icon={<Lock size={18} />}
              value={vm.confirmPassword}
              onChange={(e) => vm.setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              type="password"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={vm.isLoading}
            className="glass-accent glass-sheen mt-8 flex h-[54px] w-full items-center justify-center gap-2 rounded-[15px] text-[17px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg disabled:opacity-70"
          >
            {vm.isLoading ? <Loader2 size={22} className="animate-spin" /> : 'Reset Password'}
            {!vm.isLoading && <ArrowRight size={20} />}
          </button>

          <div className="mt-6 text-center text-[14px] text-dim">
            <button
              type="button"
              onClick={vm.backToOtp}
              className="font-bold text-primary hover:underline"
            >
              Enter the code again
            </button>
          </div>
        </>
      )}

      <div className="mt-6 text-center text-[14px] text-dim">
        <Link to="/login" className="font-bold text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}