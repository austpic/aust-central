// Recreates the Flutter `WaveClipper` (CustomClipper<Path>) used on the
// Welcome / Login / Register screens with a brand-green wave header.
//  - welcome: lib/welcome_screen.dart
//  - auth: lib/login_page.dart + lib/register_page.dart
export default function WaveHeader({
  height,
  variant = 'welcome',
  className = '',
}: {
  height: number;
  variant?: 'welcome' | 'auth';
  className?: string;
}) {
  const d =
    variant === 'welcome'
      ? 'M0 0 H1000 V340 Q750 300 500 360 Q250 420 0 320 Z'
      : 'M0 0 H1000 V140 Q500 70 500 140 Q500 220 1000 140 Z';

  return (
    <div style={{ height }} className={`glass-sheen relative w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1000 420"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="wave-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#407362" />
            <stop offset="100%" stopColor="#579d83" />
          </linearGradient>
        </defs>
        <path d={d} fill="url(#wave-bg)" />
      </svg>
    </div>
  );
}
