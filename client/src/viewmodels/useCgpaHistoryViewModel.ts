import { useCgpaCalculatorViewModel } from './CgpaContext';

// Mirrors CgpaHistoryScreen in lib/screens/cgpa_history_screen.dart
// (stateless — reads shared history from the calculator's viewModel).
export function useCgpaHistoryViewModel() {
  const viewModel = useCgpaCalculatorViewModel();
  return { history: viewModel.history };
}
