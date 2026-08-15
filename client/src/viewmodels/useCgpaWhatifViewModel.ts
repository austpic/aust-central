import { useState } from 'react';
import { useToast } from '../components/Toast';
import type { CgpaSimulation } from './CgpaContext';
import { useCgpaCalculatorViewModel } from './CgpaContext';

// Mirrors _CgpaWhatifScreenState in lib/screens/cgpa_whatif_screen.dart
export function useCgpaWhatifViewModel() {
  const viewModel = useCgpaCalculatorViewModel();
  const toast = useToast();
  const [target, setTarget] = useState('');
  const [result, setResult] = useState<CgpaSimulation | null>(null);

  function simulate() {
    const text = target.trim();
    if (text === '') return;
    const parsed = Number(text);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 4.0) {
      toast('Please enter a valid CGPA between 0.00 and 4.00', 'error');
      return;
    }
    setResult(viewModel.simulateTargetCgpa(parsed));
  }

  return {
    target,
    setTarget,
    result,
    simulate,
    currentCgpa: viewModel.cumulativeCgpa,
    completedCredits: viewModel.history.reduce((s, r) => s + r.totalCredits, 0) + viewModel.totalCurrentCredits,
  };
}
