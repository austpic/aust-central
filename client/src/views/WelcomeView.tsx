import { ArrowRight } from 'lucide-react';
import WaveHeader from '../components/WaveHeader';
import AmbientBackground from '../components/AmbientBackground';
import { useWelcomeViewModel } from '../viewmodels/useWelcomeViewModel';

// Mirrors WelcomeScreen in lib/welcome_screen.dart — wave header, brand
// headline, and a circular FAB that moves to Login.
export default function WelcomeView() {
  const { goToLogin } = useWelcomeViewModel();

  return (
    <div className="relative flex min-h-svh flex-col">
      <AmbientBackground />
      <div className="relative z-10 flex min-h-svh flex-col">
        <WaveHeader height={420} variant="welcome" />
        <div className="flex flex-1 flex-col justify-center px-10 py-10 lg:px-20">
          <h1 className="font-display text-[40px] font-bold leading-none tracking-tight text-mint-ink">
            Welcome
          </h1>
          <div className="mt-4 text-[20px] font-semibold text-mint-ink">Hello AUSTIAN!!</div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={goToLogin}
              aria-label="Continue to login"
              className="fab h-16 w-16 rounded-full shadow-glass transition-transform hover:scale-105"
            >
              <ArrowRight size={28} className="text-mint-ink" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
