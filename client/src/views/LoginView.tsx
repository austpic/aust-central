import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail, ArrowRight } from 'lucide-react';
import Field from '../components/Field';
import AuthLayout from '../components/AuthLayout';
import { useToast } from '../components/Toast';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';

// Mirrors LoginScreen in lib/login_page.dart — split-screen visual redesign.
// All behaviour (validation via toast, simulated setTimeout login, nav to
// /home) lives in useLoginViewModel and is unchanged.
export default function LoginView() {
  const toast = useToast();
  const vm = useLoginViewModel();
  const navigate = useNavigate();

  useEffect(() => {
    if (vm.message) {
      toast(vm.message, 'error');
      vm.clearMessage();
    }
  }, [vm, vm.message, toast]);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off — buses, classes and campus news are waiting."
    >
      <div className="mt-8 space-y-5">
        <Field
          label="Email"
          icon={<Mail size={18} />}
          value={vm.email}
          onChange={(e) => vm.setEmail(e.target.value)}
          placeholder="demo@email.com"
          type="email"
        />
        <Field
          label="Password"
          icon={<Lock size={18} />}
          value={vm.password}
          onChange={(e) => vm.setPassword(e.target.value)}
          placeholder="Enter your password"
          type="password"
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-[14px] text-primary">
          <input
            type="checkbox"
            checked={vm.rememberMe}
            onChange={(e) => vm.setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
          Remember Me
        </label>
        <button
          type="button"
          onClick={() => navigate('/forgot-password')}
          className="text-[14px] font-semibold text-primary hover:underline"
        >
          Forgot Password?
        </button>
      </div>

      <button
        type="button"
        onClick={vm.login}
        disabled={vm.isLoading}
        className="glass-accent glass-sheen mt-8 flex h-[54px] w-full items-center justify-center gap-2 rounded-[15px] text-[17px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg disabled:opacity-70"
      >
        {vm.isLoading ? <Loader2 size={22} className="animate-spin" /> : 'Sign In'}
        {!vm.isLoading && <ArrowRight size={20} />}
      </button>

      <div className="mt-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-glass-border" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-dim2">
          or
        </span>
        <div className="h-px flex-1 bg-glass-border" />
      </div>

      <div className="mt-6 text-center text-[14px] text-dim">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-bold text-primary hover:underline">
          Create one
        </Link>
      </div>
    </AuthLayout>
  );
}
