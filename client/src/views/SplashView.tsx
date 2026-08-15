import { useSplashViewModel } from '../viewmodels/useSplashViewModel';

// Mirrors SplashScreen in lib/splash_screen.dart — brand green, centered
// app logo, then navigates to Welcome after 3s (handled by the ViewModel).
export default function SplashView() {
  const { logo } = useSplashViewModel();

  return (
    <div className="glass-accent flex min-h-svh items-center justify-center">
      <img src={logo} alt="AUST Central" className="h-[150px] w-auto" />
    </div>
  );
}
