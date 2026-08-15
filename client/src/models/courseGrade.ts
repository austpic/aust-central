// Mirrors lib/models/course_grade_model.dart (CourseGradeModel + SemesterRecord)
export interface CourseGrade {
  courseName: string;
  credits: number;
  grade: string;
}

export interface SemesterRecord {
  semesterName: string;
  semesterGpa: number;
  cumulativeCgpa: number;
  totalCredits: number;
}

// Grade point mapping from CourseGradeModel.gradePoint
export function gradePoint(grade: string): number {
  switch (grade) {
    case 'A+':
      return 4.0;
    case 'A':
      return 3.75;
    case 'A-':
      return 3.5;
    case 'B+':
      return 3.25;
    case 'B':
      return 3.0;
    case 'B-':
      return 2.75;
    case 'C':
      return 2.5;
    case 'D':
      return 2.0;
    case 'F':
      return 0.0;
    default:
      return 0.0;
  }
}
