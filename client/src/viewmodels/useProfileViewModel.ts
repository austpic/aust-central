import { useAuth } from './AuthContext';

// Mirrors ProfileScreen in lib/views/profile/profile_screen.dart — the
// signed-in user from AuthContext, not the previous MOCK_USER fixture.
export function useProfileViewModel() {
  const { user } = useAuth();
  const name = user?.name ?? 'AUST Student';
  const email = user?.email ?? '';
  const initial = (name.trim()[0] ?? 'A').toUpperCase();
  return {
    user: { name, email, studentId: user?.studentId ?? null, department: user?.department ?? null },
    initial,
  };
}
