// Mock signed-in user. No real backend — this mirrors what Firebase Auth
// would populate (displayName + email) for the profile/home greeting screens.
import type { UserProfile } from '../models/user';

export const MOCK_USER: UserProfile = {
  name: 'Farhana Rahman',
  email: 'demo@email.com',
};
