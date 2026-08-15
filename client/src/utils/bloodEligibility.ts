/**
 * Local date helpers for the donor form.
 *
 * NOT the source of truth for eligibility — the server evaluates the 90-day
 * rule and returns the verdict on DonorProfile (eligible, daysUntilEligible,
 * progress, statusCopy). What remains here is the date-picker clamp and
 * display formatting, which are client concerns. Also exports the urgency
 * visual-style mapping used by request cards.
 */
export const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-',
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysSince(lastDonated: Date, now?: Date): number {
  const n = now ?? new Date();
  const last = startOfDay(lastDonated);
  const today = startOfDay(n);
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

export function sinceCopy(lastDonated?: Date, now?: Date): string {
  if (!lastDonated) return 'No prior donation';
  const d = daysSince(lastDonated, now);
  if (d === 0) return 'Donated today';
  if (d === 1) return 'Donated yesterday';
  if (d < 30) return `Donated ${d} days ago`;
  if (d < 60) return 'Donated about 1 month ago';
  if (d < 90) return 'Donated about 2 months ago';
  if (d < 365) return `Donated about ${Math.round(d / 30)} months ago`;
  return `Donated about ${Math.round(d / 365)} year${Math.round(d / 365) === 1 ? '' : 's'} ago`;
}

export function clampToPastOrToday(picked: Date, now?: Date): Date {
  const n = now ?? new Date();
  const today = startOfDay(n);
  const day = startOfDay(picked);
  return day.getTime() > today.getTime() ? today : day;
}

export interface UrgencyStyle {
  background: string;
  foreground: string;
}

// Maps urgency -> badge colors (UrgencyStyle) exactly as in blood_eligibility.dart
export function urgencyStyle(name: 'routine' | 'urgent' | 'critical'): UrgencyStyle {
  switch (name) {
    case 'routine':
      return { background: '#c2ded0', foreground: '#1b4332' };
    case 'urgent':
      return { background: '#fce7cf', foreground: '#d89030' };
    case 'critical':
      return { background: '#f6d6d2', foreground: '#b5392b' };
  }
}

// Border color for urgency badges (urgencyBorder)
export function urgencyBorder(name: 'routine' | 'urgent' | 'critical'): string {
  switch (name) {
    case 'routine':
      return '#1b4332';
    case 'urgent':
      return '#d89030';
    case 'critical':
      return '#b5392b';
  }
}
