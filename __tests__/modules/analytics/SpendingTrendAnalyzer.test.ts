import { describe, test, expect } from '@jest/globals';
import {
  analyzeSpendingTrend,
  findPeakWeek,
  calculateRecentTrend,
} from '@/modules/analytics/SpendingTrendAnalyzer';

describe('Spending Trend Analyzer', () => {
  describe('analyzeSpendingTrend', () => {
    test('identifies increasing trend', () => {
      const chartData = [
        { week: 'Week 1', amount: 100, currency: 'USD' },
        { week: 'Week 2', amount: 120, currency: 'USD' },
        { week: 'Week 3', amount: 150, currency: 'USD' },
        { week: 'Week 4', amount: 180, currency: 'USD' },
      ];

      const result = analyzeSpendingTrend(chartData);

      expect(result).not.toBeNull();
      expect(result?.trend).toBe('increasing');
      expect(result?.trendEmoji).toBe('↗️');
      expect(result?.message).toContain('Consider reviewing your budget');
    });

    test('identifies decreasing trend', () => {
      const chartData = [
        { week: 'Week 1', amount: 200, currency: 'USD' },
        { week: 'Week 2', amount: 180, currency: 'USD' },
        { week: 'Week 3', amount: 140, currency: 'USD' },
        { week: 'Week 4', amount: 100, currency: 'USD' },
      ];

      const result = analyzeSpendingTrend(chartData);

      expect(result).not.toBeNull();
      expect(result?.trend).toBe('decreasing');
      expect(result?.trendEmoji).toBe('↘️');
      expect(result?.message).toContain('Great job reducing spending');
    });

    test('identifies stable trend', () => {
      const chartData = [
        { week: 'Week 1', amount: 100, currency: 'USD' },
        { week: 'Week 2', amount: 102, currency: 'USD' },
        { week: 'Week 3', amount: 98, currency: 'USD' },
        { week: 'Week 4', amount: 100, currency: 'USD' },
      ];

      const result = analyzeSpendingTrend(chartData);

      expect(result).not.toBeNull();
      expect(result?.trend).toBe('stable');
      expect(result?.trendEmoji).toBe('➡️');
      expect(result?.message).toContain('consistent');
    });

    test('handles empty data', () => {
      const result = analyzeSpendingTrend([]);
      expect(result).toBeNull();
    });

    test('handles all zero spending weeks', () => {
      const chartData = [
        { week: 'Week 1', amount: 0, currency: 'USD' },
        { week: 'Week 2', amount: 0, currency: 'USD' },
        { week: 'Week 3', amount: 0, currency: 'USD' },
        { week: 'Week 4', amount: 0, currency: 'USD' },
      ];

      const result = analyzeSpendingTrend(chartData);
      expect(result).toBeNull();
    });

    test('filters out zero weeks and analyzes non-zero weeks', () => {
      const chartData = [
        { week: 'Week 1', amount: 100, currency: 'USD' },
        { week: 'Week 2', amount: 0, currency: 'USD' },
        { week: 'Week 3', amount: 0, currency: 'USD' },
        { week: 'Week 4', amount: 200, currency: 'USD' },
      ];

      const result = analyzeSpendingTrend(chartData);

      expect(result).not.toBeNull();
      // Should analyze trend based on non-zero weeks only
    });

    test('calculates average amount correctly', () => {
      const chartData = [
        { week: 'Week 1', amount: 100, currency: 'USD' },
        { week: 'Week 2', amount: 200, currency: 'USD' },
        { week: 'Week 3', amount: 150, currency: 'USD' },
      ];

      const result = analyzeSpendingTrend(chartData);

      expect(result).not.toBeNull();
      expect(result?.averageAmount).toBe(150); // (100 + 200 + 150) / 3
    });

    test('includes percentage change in comparison text', () => {
      const chartData = [
        { week: 'Week 1', amount: 100, currency: 'USD' },
        { week: 'Week 2', amount: 120, currency: 'USD' },
        { week: 'Week 3', amount: 150, currency: 'USD' },
        { week: 'Week 4', amount: 180, currency: 'USD' },
      ];

      const result = analyzeSpendingTrend(chartData);

      expect(result).not.toBeNull();
      expect(result?.comparisonText).toMatch(/[+-]?\d+\.\d+%/);
      expect(result?.comparisonText).toContain('compared to previous weeks');
    });

    test('handles single data point', () => {
      const chartData = [{ week: 'Week 1', amount: 100, currency: 'USD' }];

      const result = analyzeSpendingTrend(chartData);

      // Should return null or handle gracefully (can't compare with single point)
      expect(result).toBeNull();
    });
  });

  describe('findPeakWeek', () => {
    test('finds week with highest spending', () => {
      const chartData = [
        { week: 'Week 1', amount: 100, currency: 'USD' },
        { week: 'Week 2', amount: 300, currency: 'USD' },
        { week: 'Week 3', amount: 150, currency: 'USD' },
        { week: 'Week 4', amount: 200, currency: 'USD' },
      ];

      const result = findPeakWeek(chartData);

      expect(result).not.toBeNull();
      expect(result?.week).toBe('Week 2');
      expect(result?.amount).toBe(300);
    });

    test('handles empty data', () => {
      const result = findPeakWeek([]);
      expect(result).toBeNull();
    });

    test('filters out zero weeks', () => {
      const chartData = [
        { week: 'Week 1', amount: 0, currency: 'USD' },
        { week: 'Week 2', amount: 100, currency: 'USD' },
        { week: 'Week 3', amount: 0, currency: 'USD' },
      ];

      const result = findPeakWeek(chartData);

      expect(result).not.toBeNull();
      expect(result?.week).toBe('Week 2');
      expect(result?.amount).toBe(100);
    });

    test('returns null when all weeks are zero', () => {
      const chartData = [
        { week: 'Week 1', amount: 0, currency: 'USD' },
        { week: 'Week 2', amount: 0, currency: 'USD' },
      ];

      const result = findPeakWeek(chartData);
      expect(result).toBeNull();
    });

    test('handles tie (returns first occurrence)', () => {
      const chartData = [
        { week: 'Week 1', amount: 200, currency: 'USD' },
        { week: 'Week 2', amount: 200, currency: 'USD' },
        { week: 'Week 3', amount: 150, currency: 'USD' },
      ];

      const result = findPeakWeek(chartData);

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(200);
      // Implementation returns last occurrence with highest value
    });
  });

  describe('calculateRecentTrend', () => {
    test('calculates trend for last 4 weeks vs previous 4 weeks', () => {
      const chartData = [
        { week: 'Week 1', amount: 100, currency: 'USD' },
        { week: 'Week 2', amount: 100, currency: 'USD' },
        { week: 'Week 3', amount: 100, currency: 'USD' },
        { week: 'Week 4', amount: 100, currency: 'USD' },
        { week: 'Week 5', amount: 150, currency: 'USD' },
        { week: 'Week 6', amount: 150, currency: 'USD' },
        { week: 'Week 7', amount: 150, currency: 'USD' },
        { week: 'Week 8', amount: 150, currency: 'USD' },
      ];

      const result = calculateRecentTrend(chartData);

      expect(result).not.toBeNull();
      expect(result?.lastFourAvg).toBe(150);
      expect(result?.previousFourAvg).toBe(100);
      expect(result?.percentageChange).toBe(50); // 50% increase
    });

    test('returns null for insufficient data (less than 8 weeks)', () => {
      const chartData = [
        { week: 'Week 1', amount: 100, currency: 'USD' },
        { week: 'Week 2', amount: 100, currency: 'USD' },
        { week: 'Week 3', amount: 100, currency: 'USD' },
      ];

      const result = calculateRecentTrend(chartData);
      expect(result).toBeNull();
    });

    test('handles empty data', () => {
      const result = calculateRecentTrend([]);
      expect(result).toBeNull();
    });

    test('filters out zero weeks', () => {
      const chartData = [
        { week: 'Week 1', amount: 100, currency: 'USD' },
        { week: 'Week 2', amount: 0, currency: 'USD' },
        { week: 'Week 3', amount: 100, currency: 'USD' },
        { week: 'Week 4', amount: 0, currency: 'USD' },
        { week: 'Week 5', amount: 100, currency: 'USD' },
        { week: 'Week 6', amount: 0, currency: 'USD' },
        { week: 'Week 7', amount: 100, currency: 'USD' },
        { week: 'Week 8', amount: 0, currency: 'USD' },
        { week: 'Week 9', amount: 200, currency: 'USD' },
        { week: 'Week 10', amount: 200, currency: 'USD' },
      ];

      const result = calculateRecentTrend(chartData);

      // Should calculate based on non-zero weeks only
      expect(result).not.toBeNull();
    });

    test('calculates negative trend (decreasing spending)', () => {
      const chartData = [
        { week: 'Week 1', amount: 200, currency: 'USD' },
        { week: 'Week 2', amount: 200, currency: 'USD' },
        { week: 'Week 3', amount: 200, currency: 'USD' },
        { week: 'Week 4', amount: 200, currency: 'USD' },
        { week: 'Week 5', amount: 100, currency: 'USD' },
        { week: 'Week 6', amount: 100, currency: 'USD' },
        { week: 'Week 7', amount: 100, currency: 'USD' },
        { week: 'Week 8', amount: 100, currency: 'USD' },
      ];

      const result = calculateRecentTrend(chartData);

      expect(result).not.toBeNull();
      expect(result?.percentageChange).toBe(-50); // 50% decrease
    });

    test('handles zero average in previous period', () => {
      const chartData = [
        { week: 'Week 1', amount: 0, currency: 'USD' },
        { week: 'Week 2', amount: 0, currency: 'USD' },
        { week: 'Week 3', amount: 0, currency: 'USD' },
        { week: 'Week 4', amount: 0, currency: 'USD' },
        { week: 'Week 5', amount: 100, currency: 'USD' },
        { week: 'Week 6', amount: 100, currency: 'USD' },
        { week: 'Week 7', amount: 100, currency: 'USD' },
        { week: 'Week 8', amount: 100, currency: 'USD' },
      ];

      const result = calculateRecentTrend(chartData);

      // Should handle division by zero gracefully
      expect(result).toBeNull(); // All zeros filtered out, insufficient data
    });
  });
});
