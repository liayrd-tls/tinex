/**
 * Analytics Module
 * Export all analytics-related components and utilities
 */

export { default as SpendingInsights } from './SpendingInsights';
export {
  analyzeSpendingTrend,
  findPeakWeek,
  calculateRecentTrend,
  type TrendDirection,
  type SpendingInsight,
} from './SpendingTrendAnalyzer';
