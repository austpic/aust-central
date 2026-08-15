// Mirrors the seed data in lib/viewmodels/cgpa_calculator_viewmodel.dart
import type { CourseGrade, SemesterRecord } from '../models/courseGrade';

export const SEED_COURSES: CourseGrade[] = [
  { courseName: 'Data Structures', credits: 3.0, grade: 'A' },
  { courseName: 'Database Systems', credits: 3.0, grade: 'A' },
  { courseName: 'Digital Logic Design', credits: 3.0, grade: 'A' },
  { courseName: 'Discrete Mathematics', credits: 3.0, grade: 'A' },
  { courseName: 'English Composition', credits: 3.0, grade: 'A' },
  { courseName: 'Physics Lab', credits: 1.5, grade: 'A' },
];

export const SEMESTER_HISTORY: SemesterRecord[] = [
  { semesterName: 'Spring 2023', semesterGpa: 3.85, cumulativeCgpa: 3.85, totalCredits: 18 },
  { semesterName: 'Summer 2023', semesterGpa: 3.72, cumulativeCgpa: 3.78, totalCredits: 15 },
  { semesterName: 'Fall 2023', semesterGpa: 3.9, cumulativeCgpa: 3.82, totalCredits: 18 },
  { semesterName: 'Spring 2024', semesterGpa: 3.65, cumulativeCgpa: 3.78, totalCredits: 16 },
  { semesterName: 'Summer 2024', semesterGpa: 3.5, cumulativeCgpa: 3.72, totalCredits: 12 },
];
