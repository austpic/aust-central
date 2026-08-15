import { z } from 'zod';

/**
 * AUST grade points, copied from CourseGradeModel.gradePoint in the Flutter
 * app so client and server can never disagree about what an "A" is worth.
 *
 * The server is now the authority: the client may still compute a preview, but
 * anything stored or displayed as official comes from here.
 */
export const GRADE_POINTS = Object.freeze({
  A_PLUS: 4.0,
  A: 3.75,
  A_MINUS: 3.5,
  B_PLUS: 3.25,
  B: 3.0,
  B_MINUS: 2.75,
  C: 2.5,
  D: 2.0,
  F: 0.0,
});

export const gradeSchema = z.enum(Object.keys(GRADE_POINTS));

export const courseResponseSchema = z.object({
  id: z.string().uuid(),
  courseName: z.string(),
  credits: z.number(),
  grade: gradeSchema,
  gradePoint: z.number(),
});

export const semesterResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  position: z.number().int(),
  courses: z.array(courseResponseSchema),
  // Derived, never stored — see service.summarise().
  totalCredits: z.number(),
  gpa: z.number(),
});

export const cgpaSummaryResponseSchema = z.object({
  semesters: z.array(
    semesterResponseSchema.extend({ cumulativeCgpa: z.number() }),
  ),
  totalCredits: z.number(),
  cgpa: z.number(),
});

export const createSemesterBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    position: z.number().int().min(0).max(50).optional(),
  })
  .strict();

export const updateSemesterBodySchema = createSemesterBodySchema
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' });

export const createCourseBodySchema = z
  .object({
    courseName: z.string().trim().min(1).max(160),
    // Bounded to match the CHECK constraint; 1.5-credit labs mean this cannot
    // be an integer.
    credits: z.number().positive().max(30),
    grade: gradeSchema,
  })
  .strict();

export const updateCourseBodySchema = createCourseBodySchema
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' });

/**
 * What-if projection: hypothetical courses that are NOT persisted, used by
 * cgpa_whatif_screen.dart to answer "what does an A in this do to my CGPA?".
 */
export const whatIfBodySchema = z
  .object({
    courses: z
      .array(
        z.object({
          credits: z.number().positive().max(30),
          grade: gradeSchema,
        }),
      )
      .min(1)
      .max(20),
  })
  .strict();

export const whatIfResponseSchema = z.object({
  currentCgpa: z.number(),
  projectedCgpa: z.number(),
  delta: z.number(),
  currentCredits: z.number(),
  projectedCredits: z.number(),
});
