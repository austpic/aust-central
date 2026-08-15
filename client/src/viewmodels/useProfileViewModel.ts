import { MOCK_USER } from '../data/user';

// Mirrors ProfileScreen in lib/screens/profile_screen.dart (stateless —
// avatar initial + name + email + a details card).
export function useProfileViewModel() {
  const user = MOCK_USER;
  const initial = (user.name.trim()[0] ?? 'A').toUpperCase();
  return { user, initial };
}
