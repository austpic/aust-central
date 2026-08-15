import { assertOwned, deleteOwned, findOwned, updateOwned } from '../../lib/ownership.js';
import { NotFoundError } from '../../lib/errors.js';
import { GRADE_POINTS } from './schema.js';

/**
 * CGPA calculation.
 *
 * GPA is never stored. Persisting a computed average invites the classic bug
 * where a course is edited and the cached figure quietly goes stale; deriving
 * it on read means the number shown is always the number the data implies.
 */

/** Prisma returns Decimal objects; normalise to a JS number once, here. */
function creditsOf(course) {
  return Number(course.credits);
}

/** Round to 2dp for transport. Kept full precision until the very end. */
function round2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Credit-weighted mean, the standard GPA formula:
 *   sum(credits * gradePoint) / sum(credits)
 */
export function computeGpa(courses) {
  let points = 0;
  let credits = 0;
  for (const course of courses) {
    const weight = creditsOf(course);
    points += weight * GRADE_POINTS[course.grade];
    credits += weight;
  }
  // No courses means no opinion — 0 rather than NaN from dividing by zero.
  return { gpa: credits === 0 ? 0 : points / credits, totalCredits: credits, points };
}

function toCourseResponse(course) {
  return {
    id: course.id,
    courseName: course.courseName,
    credits: creditsOf(course),
    grade: course.grade,
    gradePoint: GRADE_POINTS[course.grade],
  };
}

function toSemesterResponse(semester) {
  const { gpa, totalCredits } = computeGpa(semester.courses ?? []);
  return {
    id: semester.id,
    name: semester.name,
    position: semester.position,
    courses: (semester.courses ?? []).map(toCourseResponse),
    totalCredits: round2(totalCredits),
    gpa: round2(gpa),
  };
}

async function loadSemesters(app, userId) {
  return app.prisma.semester.findMany({
    where: { userId },
    include: { courses: { orderBy: { createdAt: 'asc' } } },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function listSemesters(app, userId) {
  const semesters = await loadSemesters(app, userId);
  return semesters.map(toSemesterResponse);
}

/**
 * Full transcript with a running cumulative CGPA per semester — the shape
 * cgpa_history_screen.dart renders.
 */
export async function summary(app, userId) {
  const semesters = await loadSemesters(app, userId);

  let runningPoints = 0;
  let runningCredits = 0;

  const withCumulative = semesters.map((semester) => {
    const base = toSemesterResponse(semester);
    const { points, totalCredits } = computeGpa(semester.courses ?? []);
    runningPoints += points;
    runningCredits += totalCredits;
    return {
      ...base,
      cumulativeCgpa: round2(runningCredits === 0 ? 0 : runningPoints / runningCredits),
    };
  });

  return {
    semesters: withCumulative,
    totalCredits: round2(runningCredits),
    cgpa: round2(runningCredits === 0 ? 0 : runningPoints / runningCredits),
  };
}

export async function createSemester(app, userId, input) {
  // Append to the end unless the client pins a position.
  const position =
    input.position ??
    (await app.prisma.semester.count({ where: { userId } }));

  const semester = await app.prisma.semester.create({
    data: { userId, name: input.name, position },
  });
  return toSemesterResponse({ ...semester, courses: [] });
}

export async function updateSemester(app, userId, id, input) {
  await updateOwned({
    model: app.prisma.semester,
    id,
    userId,
    data: input,
    resource: 'Semester',
  });
  const semester = await findOwned({
    model: app.prisma.semester,
    id,
    userId,
    resource: 'Semester',
    include: { courses: true },
  });
  return toSemesterResponse(semester);
}

export async function deleteSemester(app, userId, id) {
  await deleteOwned({ model: app.prisma.semester, id, userId, resource: 'Semester' });
}

export async function addCourse(app, userId, semesterId, input) {
  await assertOwned({
    model: app.prisma.semester,
    id: semesterId,
    userId,
    resource: 'Semester',
  });

  await app.prisma.courseGrade.create({
    data: {
      semesterId,
      courseName: input.courseName,
      credits: input.credits,
      grade: input.grade,
    },
  });

  const semester = await findOwned({
    model: app.prisma.semester,
    id: semesterId,
    userId,
    resource: 'Semester',
    include: { courses: { orderBy: { createdAt: 'asc' } } },
  });
  return toSemesterResponse(semester);
}

export async function updateCourse(app, userId, semesterId, courseId, input) {
  await assertOwned({
    model: app.prisma.semester,
    id: semesterId,
    userId,
    resource: 'Semester',
  });

  const { count } = await app.prisma.courseGrade.updateMany({
    where: { id: courseId, semesterId },
    data: input,
  });
  if (count === 0) throw new NotFoundError('Course not found');

  const semester = await findOwned({
    model: app.prisma.semester,
    id: semesterId,
    userId,
    resource: 'Semester',
    include: { courses: { orderBy: { createdAt: 'asc' } } },
  });
  return toSemesterResponse(semester);
}

export async function deleteCourse(app, userId, semesterId, courseId) {
  await assertOwned({
    model: app.prisma.semester,
    id: semesterId,
    userId,
    resource: 'Semester',
  });

  const { count } = await app.prisma.courseGrade.deleteMany({
    where: { id: courseId, semesterId },
  });
  if (count === 0) throw new NotFoundError('Course not found');
}

/**
 * Project the effect of hypothetical courses without persisting anything.
 */
export async function whatIf(app, userId, input) {
  const semesters = await loadSemesters(app, userId);
  const existing = semesters.flatMap((s) => s.courses ?? []);

  const current = computeGpa(existing);
  const projected = computeGpa([...existing, ...input.courses]);

  return {
    currentCgpa: round2(current.gpa),
    projectedCgpa: round2(projected.gpa),
    delta: round2(projected.gpa - current.gpa),
    currentCredits: round2(current.totalCredits),
    projectedCredits: round2(projected.totalCredits),
  };
}
