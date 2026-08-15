import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CourseGrade } from '../models/courseGrade';
import { gradePoint } from '../models/courseGrade';
import { SEED_COURSES, SEMESTER_HISTORY } from '../data/cgpaCourses';

export interface CgpaSimulation {
  currentCgpa: number;
  targetCgpa: number;
  completedCredits: number;
  remainingCredits: number;
  requiredGpa: number;
  isAchievable: boolean;
  message: string;
}

// Shared across the three CGPA screens exactly like the Flutter
// ChangeNotifierProvider.value wiring (the calculator's viewModel instance is
// passed to What-If and History). Mirrors lib/viewmodels/cgpa_calculator_viewmodel.dart.
interface CgpaState {
  courses: CourseGrade[];
  history: typeof SEMESTER_HISTORY;
  isCalculated: boolean;
  semesterGpa: number;
  cumulativeCgpa: number;
  totalCurrentCredits: number;
  updateGrade: (index: number, grade: string) => void;
  calculate: () => void;
  simulateTargetCgpa: (target: number) => CgpaSimulation;
  goToWhatIf: () => void;
  goToHistory: () => void;
}

const CgpaContext = createContext<CgpaState | null>(null);

export function CgpaProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseGrade[]>(SEED_COURSES);
  const [isCalculated, setIsCalculated] = useState(false);
  const history = SEMESTER_HISTORY;

  const totalCurrentCredits = useMemo(
    () => courses.reduce((sum, c) => sum + c.credits, 0),
    [courses],
  );

  const semesterGpa = useMemo(() => {
    const totalPoints = courses.reduce(
      (sum, c) => sum + gradePoint(c.grade) * c.credits,
      0,
    );
    return totalCurrentCredits === 0 ? 0 : totalPoints / totalCurrentCredits;
  }, [courses, totalCurrentCredits]);

  const cumulativeCgpa = useMemo(() => {
    if (history.length === 0) return semesterGpa;
    let totalPoints = history.reduce(
      (sum, r) => sum + r.semesterGpa * r.totalCredits,
      0,
    );
    let totalCredits = history.reduce((sum, r) => sum + r.totalCredits, 0);
    totalPoints += semesterGpa * totalCurrentCredits;
    totalCredits += totalCurrentCredits;
    return totalCredits === 0 ? 0 : totalPoints / totalCredits;
  }, [history, semesterGpa, totalCurrentCredits]);

  const value: CgpaState = useMemo(() => {
    function updateGrade(index: number, grade: string) {
      setCourses((prev) => prev.map((c, i) => (i === index ? { ...c, grade } : c)));
      setIsCalculated(false);
    }

    function calculate() {
      setIsCalculated(true);
    }

    function simulateTargetCgpa(target: number): CgpaSimulation {
      const currentCgpa = cumulativeCgpa;
      const totalPastCredits =
        history.reduce((sum, r) => sum + r.totalCredits, 0) + totalCurrentCredits;
      const remainingCredits = 30;
      const requiredGpa =
        (target * (totalPastCredits + remainingCredits) -
          currentCgpa * totalPastCredits) /
        remainingCredits;
      const clamped = Math.max(0, Math.min(4.0, requiredGpa));
      const achievable = requiredGpa <= 4.0 && requiredGpa >= 0.0;

      return {
        currentCgpa,
        targetCgpa: target,
        completedCredits: totalPastCredits,
        remainingCredits,
        requiredGpa: clamped,
        isAchievable: achievable,
        message: achievable
          ? `You need a GPA of ${clamped.toFixed(2)} in your remaining ${remainingCredits} credits to achieve a CGPA of ${target.toFixed(2)}.`
          : `Unfortunately, a CGPA of ${target.toFixed(2)} is not achievable with ${remainingCredits} remaining credits.`,
      };
    }

    return {
      courses,
      history,
      isCalculated,
      semesterGpa,
      cumulativeCgpa,
      totalCurrentCredits,
      updateGrade,
      calculate,
      simulateTargetCgpa,
      goToWhatIf: () => navigate('/cgpa/whatif'),
      goToHistory: () => navigate('/cgpa/history'),
    };
  }, [courses, history, isCalculated, semesterGpa, cumulativeCgpa, totalCurrentCredits, navigate]);

  return <CgpaContext.Provider value={value}>{children}</CgpaContext.Provider>;
}

// The calculator screen's ViewModel hook.
export function useCgpaCalculatorViewModel(): CgpaState {
  const ctx = useContext(CgpaContext);
  if (!ctx) throw new Error('useCgpaCalculatorViewModel must be used within CgpaProvider');
  return ctx;
}
