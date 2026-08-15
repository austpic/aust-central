import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Lock, Mail, User, ArrowRight } from 'lucide-react';
import Field from '../components/Field';
import AuthLayout from '../components/AuthLayout';
import { useToast } from '../components/Toast';
import { useRegisterViewModel } from '../viewmodels/useRegisterViewModel';

// Mirrors RegisterPage in lib/register_page.dart — split-screen visual
// redesign. All behaviour (validation via toast, simulated setTimeout
// register, nav to /home) lives in useRegisterViewModel and is unchanged.
export default function RegisterView() {
  const toast = useToast();
  const vm = useRegisterViewModel();

  useEffect(() => {
    if (vm.message) {
      toast(vm.message, vm.message === 'Account created successfully!' ? 'success' : 'error');
      vm.clearMessage();
    }
  }, [vm, vm.message, toast]);

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join AUST Central in under a minute — it's free for AUST students."
    >
      <div className="mt-8 space-y-5">
        <Field
          label="Full Name"
          icon={<User size={18} />}
          value={vm.name}
          onChange={(e) => vm.setName(e.target.value)}
          placeholder="Enter your full name"
        />
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
        <Field
          label="Confirm Password"
          icon={<Lock size={18} />}
          value={vm.confirmPassword}
          onChange={(e) => vm.setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          type="password"
        />
      </div>

      <button
        type="button"
        onClick={vm.register}
        disabled={vm.isLoading}
        className="glass-accent glass-sheen mt-8 flex h-[54px] w-full items-center justify-center gap-2 rounded-[15px] text-[17px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg disabled:opacity-70"
      >
        {vm.isLoading ? <Loader2 size={22} className="animate-spin" /> : 'Get Started'}
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
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
