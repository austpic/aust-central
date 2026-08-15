import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CourseGrade, SemesterRecord } from '../models/courseGrade';
import { academicRepository } from '../repositories/academic';
import { ApiError } from '../api/errors';

export interface CgpaSimulation {
  currentCgpa: number;
  targetCgpa: number;
  completedCredits: number;
  remainingCredits: number;
  requiredGpa: number;
  isAchievable: boolean;
  message: string;
}

/** "A_PLUS" (API) ⇄ "A+" (UI) — matches the mapping in the Flutter view model. */
function toDisplayGrade(apiGrade: string): string {
  switch (apiGrade) {
    case 'A_PLUS': return 'A+';
    case 'A_MINUS': return 'A-';
    case 'B_PLUS': return 'B+';
    case 'B_MINUS': return 'B-';
    default: return apiGrade;
  }
}
function toApiGrade(displayGrade: string): string {
  switch (displayGrade) {
    case 'A+': return 'A_PLUS';
    case 'A-': return 'A_MINUS';
    case 'B+': return 'B_PLUS';
    case 'B-': return 'B_MINUS';
    default: return displayGrade;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CourseRef = { courseId: string; semesterId: string };

// Shared across the three CGPA screens, mirroring the Flutter
// ChangeNotifierProvider.value wiring and CGPACalculatorViewModel — including
// the important part: GPA figures come from the server, which owns the grade
// scale, so an edited grade can never disagree between screens.
interface CgpaState {
  courses: CourseGrade[];
  history: SemesterRecord[];
  isCalculated: boolean;
  loading: boolean;
  error: string | null;
  semesterGpa: number;
  cumulativeCgpa: number;
  totalCurrentCredits: number;
  updateGrade: (index: number, grade: string) => void;
  calculate: () => void;
  simulateTargetCgpa: (target: number) => CgpaSimulation;
  goToWhatIf: () => void;
  goToHistory: () => void;
  reload: () => void;
}

const CgpaContext = createContext<CgpaState | null>(null);

export function CgpaProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseGrade[]>([]);
  const [courseRefs, setCourseRefs] = useState<CourseRef[]>([]);
  const [history, setHistory] = useState<SemesterRecord[]>([]);
  const [serverCgpa, setServerCgpa] = useState(0);
  const [serverCredits, setServerCredits] = useState(0);
  const [isCalculated, setIsCalculated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await academicRepository.cgpaSummary();
      const semesters = summary.semesters as Array<{
        id: string;
        name: string;
        gpa: number;
        cumulativeCgpa: number;
        totalCredits: number;
        courses: Array<{ id: string; courseName: string; credits: number; grade: string }>;
      }>;

      setHistory(
        semesters.map((s) => ({
          semesterName: s.name,
          semesterGpa: s.gpa,
          cumulativeCgpa: s.cumulativeCgpa,
          totalCredits: s.totalCredits,
        })),
      );

      // The current semester is the last one — that is the set the
      // calculator screen lets you edit.
      const current = semesters.at(-1);
      setCourses(
        (current?.courses ?? []).map((c) => ({
          courseName: c.courseName,
          credits: c.credits,
          grade: toDisplayGrade(c.grade),
        })),
      );
      setCourseRefs(
        (current?.courses ?? []).map((c) => ({ courseId: c.id, semesterId: current!.id })),
      );
      setServerCgpa(summary.cgpa);
      setServerCredits(summary.totalCredits);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your CGPA.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalCurrentCredits = useMemo(
    () => courses.reduce((sum, c) => sum + c.credits, 0),
    [courses],
  );

  // Local instant feedback as a grade dropdown changes; the server figure
  // (serverCgpa) is what actually gets persisted and shown as "current CGPA".
  const semesterGpa = useMemo(() => {
    const totalPoints = courses.reduce((sum, c) => sum + gradePointOf(c.grade) * c.credits, 0);
    return totalCurrentCredits === 0 ? 0 : totalPoints / totalCurrentCredits;
  }, [courses, totalCurrentCredits]);

  const value: CgpaState = useMemo(() => {
    async function updateGrade(index: number, grade: string) {
      const previous = courses[index]?.grade;
      setCourses((prev) => prev.map((c, i) => (i === index ? { ...c, grade } : c)));
      setIsCalculated(false);

      const ref = courseRefs[index];
      if (!ref) return;
      try {
        await academicRepository.updateCourse(ref.semesterId, ref.courseId, {
          grade: toApiGrade(grade),
        });
        // Refresh the server figure so "current CGPA" reflects the edit
        // rather than silently going stale.
        const summary = await academicRepository.cgpaSummary();
        setServerCgpa(summary.cgpa);
        setServerCredits(summary.totalCredits);
      } catch {
        if (previous) setCourses((prev) => prev.map((c, i) => (i === index ? { ...c, grade: previous } : c)));
      }
    }

    function calculate() {
      setIsCalculated(true);
    }

    // Kept client-side: a projection over hypothetical future credits, not a
    // fact about the student's record. /cgpa/what-if covers the other case —
    // projecting specific courses against the real transcript.
    function simulateTargetCgpa(target: number): CgpaSimulation {
      const currentCgpa = serverCgpa;
      const totalPastCredits = serverCredits;
      const remainingCredits = 30;
      const requiredGpa =
        (target * (totalPastCredits + remainingCredits) - currentCgpa * totalPastCredits) /
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
      loading,
      error,
      semesterGpa,
      cumulativeCgpa: serverCgpa,
      totalCurrentCredits,
      updateGrade,
      calculate,
      simulateTargetCgpa,
      goToWhatIf: () => navigate('/cgpa/whatif'),
      goToHistory: () => navigate('/cgpa/history'),
      reload: () => {
        load();
      },
    };
  }, [
    courses, courseRefs, history, isCalculated, loading, error,
    semesterGpa, serverCgpa, serverCredits, totalCurrentCredits, navigate, load,
  ]);

  return <CgpaContext.Provider value={value}>{children}</CgpaContext.Provider>;
}

function gradePointOf(grade: string): number {
  switch (grade) {
    case 'A+': return 4.0;
    case 'A': return 3.75;
    case 'A-': return 3.5;
    case 'B+': return 3.25;
    case 'B': return 3.0;
    case 'B-': return 2.75;
    case 'C': return 2.5;
    case 'D': return 2.0;
    case 'F': return 0.0;
    default: return 0.0;
  }
}

// The calculator screen's ViewModel hook.
export function useCgpaCalculatorViewModel(): CgpaState {
  const ctx = useContext(CgpaContext);
  if (!ctx) throw new Error('useCgpaCalculatorViewModel must be used within CgpaProvider');
  return ctx;
}
