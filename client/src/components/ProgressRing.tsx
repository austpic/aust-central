import { useId, type ReactNode } from 'react';

// SVG circular progress ring ported from campus_app_redesign_v7.html
// (CGPA + to-do screens). A pure presentation of existing data: it only
// renders `progress` (0..1) from the ViewModel. The stroke is a linear
// gradient and the ring animates via a CSS transition on stroke-dashoffset
// (auto-disabled by the global prefers-reduced-motion rule).
export default function ProgressRing({
  size = 150,
  strokeWidth = 10,
  progress,
  colors = ['#2f8f6a', '#57C7EC', '#B98BF2'],
  trackColor = 'rgba(16,36,26,0.10)',
  children,
  className = '',
}: {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  colors?: string[];
  trackColor?: string;
  children?: ReactNode;
  className?: string;
}) {
  const gradientId = useId();
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - clamped);

  const stops = colors.map((color, i) => (
    <stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={color} />
  ));

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(clamped * 100)}%`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {stops}
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
