import { describe, test, expect } from '@jest/globals';
import {
  getCurrentPeriodDates,
  getPeriodLabel,
  calculateBudgetProgress,
  getProgressColor,
  formatPeriodRange,
  getDaysRemaining,
} from '@/modules/budgets/budgetUtils';
import { BudgetPeriod } from '@/core/models';

describe('Budget Utils', () => {
  describe('getCurrentPeriodDates', () => {
    test('calculates daily period correctly', () => {
      const referenceDate = new Date('2024-03-15T12:00:00Z');
      const result = getCurrentPeriodDates('day', referenceDate);

      expect(result.start.getDate()).toBe(15);
      expect(result.start.getMonth()).toBe(2); // March is month 2 (0-indexed)
      expect(result.start.getFullYear()).toBe(2024);
      expect(result.start.getHours()).toBe(0);
      expect(result.start.getMinutes()).toBe(0);
    });

    test('calculates weekly period (Monday start)', () => {
      // Friday, March 15, 2024
      const referenceDate = new Date('2024-03-15T12:00:00');
      const result = getCurrentPeriodDates('week', referenceDate);

      // Should start on Monday (March 11)
      expect(result.start.getDate()).toBe(11);
      expect(result.start.getDay()).toBe(1); // Monday

      // Should end on Sunday (March 17)
      expect(result.end.getDate()).toBe(17);
      expect(result.end.getDay()).toBe(0); // Sunday
    });

    test('calculates monthly period correctly', () => {
      const referenceDate = new Date('2024-03-15T12:00:00Z');
      const result = getCurrentPeriodDates('month', referenceDate);

      expect(result.start.getDate()).toBe(1);
      expect(result.start.getMonth()).toBe(2); // March
      expect(result.end.getDate()).toBe(31);
      expect(result.end.getMonth()).toBe(2); // March
    });

    test('calculates yearly period correctly', () => {
      const referenceDate = new Date('2024-06-15T12:00:00Z');
      const result = getCurrentPeriodDates('year', referenceDate);

      expect(result.start.getDate()).toBe(1);
      expect(result.start.getMonth()).toBe(0); // January
      expect(result.start.getFullYear()).toBe(2024);
      expect(result.end.getDate()).toBe(31);
      expect(result.end.getMonth()).toBe(11); // December
      expect(result.end.getFullYear()).toBe(2024);
    });

    test('throws error for unknown period', () => {
      expect(() => {
        getCurrentPeriodDates('invalid' as BudgetPeriod);
      }).toThrow('Unknown period: invalid');
    });

    test('uses current date when no reference date provided', () => {
      const result = getCurrentPeriodDates('day');
      const today = new Date();

      expect(result.start.getDate()).toBe(today.getDate());
      expect(result.start.getMonth()).toBe(today.getMonth());
      expect(result.start.getFullYear()).toBe(today.getFullYear());
    });
  });

  describe('getPeriodLabel', () => {
    test('returns correct label for day', () => {
      expect(getPeriodLabel('day')).toBe('Daily');
    });

    test('returns correct label for week', () => {
      expect(getPeriodLabel('week')).toBe('Weekly');
    });

    test('returns correct label for month', () => {
      expect(getPeriodLabel('month')).toBe('Monthly');
    });

    test('returns correct label for year', () => {
      expect(getPeriodLabel('year')).toBe('Yearly');
    });

    test('returns original value for unknown period', () => {
      expect(getPeriodLabel('unknown' as BudgetPeriod)).toBe('unknown');
    });
  });

  describe('calculateBudgetProgress', () => {
    test('calculates progress percentage correctly', () => {
      expect(calculateBudgetProgress(50, 100)).toBe(50);
      expect(calculateBudgetProgress(75, 100)).toBe(75);
      expect(calculateBudgetProgress(100, 100)).toBe(100);
    });

    test('handles over-budget scenarios', () => {
      expect(calculateBudgetProgress(150, 100)).toBe(150);
    });

    test('rounds to nearest integer', () => {
      expect(calculateBudgetProgress(33.4, 100)).toBe(33);
      expect(calculateBudgetProgress(33.6, 100)).toBe(34);
    });

    test('handles zero target', () => {
      expect(calculateBudgetProgress(50, 0)).toBe(0);
    });

    test('handles zero spent', () => {
      expect(calculateBudgetProgress(0, 100)).toBe(0);
    });

    test('handles negative target', () => {
      expect(calculateBudgetProgress(50, -100)).toBe(0);
    });
  });

  describe('getProgressColor', () => {
    test('returns green for 0-50%', () => {
      expect(getProgressColor(0)).toBe('#22c55e');
      expect(getProgressColor(25)).toBe('#22c55e');
      expect(getProgressColor(50)).toBe('#22c55e');
    });

    test('returns yellow for 50-75%', () => {
      expect(getProgressColor(51)).toBe('#eab308');
      expect(getProgressColor(60)).toBe('#eab308');
      expect(getProgressColor(75)).toBe('#eab308');
    });

    test('returns orange for 75-90%', () => {
      expect(getProgressColor(76)).toBe('#f97316');
      expect(getProgressColor(80)).toBe('#f97316');
      expect(getProgressColor(90)).toBe('#f97316');
    });

    test('returns red for 90%+', () => {
      expect(getProgressColor(91)).toBe('#ef4444');
      expect(getProgressColor(100)).toBe('#ef4444');
      expect(getProgressColor(150)).toBe('#ef4444');
    });
  });

  describe('formatPeriodRange', () => {
    test('formats same day', () => {
      const date = new Date('2024-03-15');
      const result = formatPeriodRange(date, date);

      // Should only show one date
      expect(result).not.toContain('-');
    });

    test('formats range within same year', () => {
      const start = new Date('2024-03-01');
      const end = new Date('2024-03-31');
      const result = formatPeriodRange(start, end);

      // Should include both dates but not years
      expect(result).toContain('-');
      expect(result).not.toContain('2024');
    });

    test('formats range across different years', () => {
      const start = new Date('2023-12-15');
      const end = new Date('2024-01-15');
      const result = formatPeriodRange(start, end);

      // Should include both dates with years
      expect(result).toContain('-');
      expect(result).toContain('2023');
      expect(result).toContain('2024');
    });
  });

  describe('getDaysRemaining', () => {
    test('calculates days remaining correctly', () => {
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + 7);

      const result = getDaysRemaining(futureDate);

      // Should be around 7 days (allowing for time differences)
      expect(result).toBeGreaterThanOrEqual(6);
      expect(result).toBeLessThanOrEqual(8);
    });

    test('returns 0 for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(getDaysRemaining(pastDate)).toBe(0);
    });

    test('returns 0 for today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = getDaysRemaining(today);
      expect(result).toBeLessThanOrEqual(1);
    });

    test('rounds up partial days', () => {
      const now = new Date();
      const future = new Date(now);
      future.setHours(future.getHours() + 25); // 1 day and 1 hour

      const result = getDaysRemaining(future);
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });
});
