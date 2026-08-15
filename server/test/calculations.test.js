import { describe, expect, it } from 'vitest';

import { computeGpa } from '../src/modules/cgpa/service.js';
import { GRADE_POINTS } from '../src/modules/cgpa/schema.js';
import { DONATION_INTERVAL_DAYS, eligibility } from '../src/modules/blood/service.js';

/**
 * Pure calculation tests — no database, no HTTP.
 *
 * These two rules moved from the Flutter client to the server, which makes the
 * server authoritative. Pinning them here is what stops the two implementations
 * drifting apart while old app versions are still installed.
 */

describe('GPA calculation', () => {
  it('matches the grade scale the app uses', () => {
    // Straight from CourseGradeModel.gradePoint in the Flutter source.
    expect(GRADE_POINTS.A_PLUS).toBe(4.0);
    expect(GRADE_POINTS.A).toBe(3.75);
    expect(GRADE_POINTS.A_MINUS).toBe(3.5);
    expect(GRADE_POINTS.B_PLUS).toBe(3.25);
    expect(GRADE_POINTS.B).toBe(3.0);
    expect(GRADE_POINTS.B_MINUS).toBe(2.75);
    expect(GRADE_POINTS.C).toBe(2.5);
    expect(GRADE_POINTS.D).toBe(2.0);
    expect(GRADE_POINTS.F).toBe(0.0);
  });

  it('weights by credit, not by course count', () => {
    // A 3-credit A+ and a 1-credit F must not average to 2.0.
    const { gpa } = computeGpa([
      { credits: 3, grade: 'A_PLUS' },
      { credits: 1, grade: 'F' },
    ]);
    expect(gpa).toBeCloseTo(3.0, 5); // (3*4 + 1*0) / 4
  });

  it('handles half-credit labs', () => {
    const { gpa, totalCredits } = computeGpa([
      { credits: 3, grade: 'A' },
      { credits: 1.5, grade: 'A_PLUS' },
    ]);
    expect(totalCredits).toBe(4.5);
    expect(gpa).toBeCloseTo((3 * 3.75 + 1.5 * 4.0) / 4.5, 5);
  });

  it('returns zero rather than NaN with no courses', () => {
    const { gpa, totalCredits } = computeGpa([]);
    expect(gpa).toBe(0);
    expect(totalCredits).toBe(0);
  });

  it('accepts Prisma Decimal-like credit values', () => {
    // Prisma hands back Decimal objects, not numbers.
    const { totalCredits } = computeGpa([
      { credits: { toString: () => '3' }, grade: 'A' },
    ]);
    expect(totalCredits).toBe(3);
  });
});

describe('blood donation eligibility', () => {
  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  it('treats a donor with no history as eligible', () => {
    const result = eligibility(null);
    expect(result.eligible).toBe(true);
    expect(result.statusCopy).toMatch(/no donation/i);
  });

  it('blocks a donor who gave blood today', () => {
    const result = eligibility(new Date());
    expect(result.eligible).toBe(false);
    expect(result.daysUntilEligible).toBe(DONATION_INTERVAL_DAYS);
  });

  it('is not eligible one day before the window closes', () => {
    const result = eligibility(daysAgo(DONATION_INTERVAL_DAYS - 1));
    expect(result.eligible).toBe(false);
    expect(result.daysUntilEligible).toBe(1);
  });

  it('becomes eligible exactly on day 90', () => {
    // The boundary is the whole point of the rule — off by one here means
    // telling a student they may donate when they may not.
    const result = eligibility(daysAgo(DONATION_INTERVAL_DAYS));
    expect(result.eligible).toBe(true);
    expect(result.daysUntilEligible).toBe(0);
  });

  it('never reports negative days remaining', () => {
    const result = eligibility(daysAgo(500));
    expect(result.daysUntilEligible).toBe(0);
    expect(result.progress).toBe(1);
  });
});
