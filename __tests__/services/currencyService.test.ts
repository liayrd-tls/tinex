import { describe, test, expect } from '@jest/globals';
import { formatCurrency, clearCurrencyCache } from '@/shared/services/currencyService';
import { Currency } from '@/core/models';

describe('Currency Service', () => {
  describe('formatCurrency', () => {
    test('formats USD correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$ 1234.56');
    });

    test('formats EUR correctly', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€ 1234.56');
    });

    test('formats GBP correctly', () => {
      expect(formatCurrency(1234.56, 'GBP')).toBe('£ 1234.56');
    });

    test('formats UAH correctly', () => {
      expect(formatCurrency(1234.56, 'UAH')).toBe('₴ 1234.56');
    });

    test('formats CAD correctly', () => {
      expect(formatCurrency(1234.56, 'CAD')).toBe('C$ 1234.56');
    });

    test('formats AUD correctly', () => {
      expect(formatCurrency(1234.56, 'AUD')).toBe('A$ 1234.56');
    });

    test('formats SGD correctly', () => {
      expect(formatCurrency(1234.56, 'SGD')).toBe('S$ 1234.56');
    });

    test('formats CHF correctly', () => {
      expect(formatCurrency(1234.56, 'CHF')).toBe('CHF 1234.56');
    });

    test('formats JPY without decimals', () => {
      expect(formatCurrency(1234.56, 'JPY')).toBe('¥ 1,235');
    });

    test('formats CNY correctly', () => {
      expect(formatCurrency(1234.56, 'CNY')).toBe('¥ 1234.56');
    });

    test('handles zero amount', () => {
      expect(formatCurrency(0, 'USD')).toBe('$ 0.00');
    });

    test('handles negative amount', () => {
      expect(formatCurrency(-50.25, 'USD')).toBe('$ -50.25');
    });

    test('handles very large amount', () => {
      expect(formatCurrency(1000000.99, 'EUR')).toBe('€ 1000000.99');
    });

    test('rounds to 2 decimal places', () => {
      expect(formatCurrency(99.999, 'USD')).toBe('$ 100.00');
      expect(formatCurrency(10.001, 'USD')).toBe('$ 10.00');
    });
  });

  describe('clearCurrencyCache', () => {
    test('clears cache without errors', () => {
      expect(() => clearCurrencyCache()).not.toThrow();
    });
  });
});
