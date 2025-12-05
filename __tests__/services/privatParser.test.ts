import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parsePrivatPDF } from '@/shared/services/privatParser';

describe('Privat PDF Parser', () => {
  let pdfBuffer: Buffer;

  beforeAll(() => {
    // Load the test PDF file
    const pdfPath = join(process.cwd(), 'privat_statement.pdf');
    pdfBuffer = readFileSync(pdfPath);
  });

  test('should parse PDF without errors', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    expect(result).toBeDefined();
    expect(result.transactions).toBeDefined();
    expect(Array.isArray(result.transactions)).toBe(true);
  });

  test('should extract period information', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    expect(result.period).toBeDefined();
    expect(typeof result.period).toBe('string');
    console.log('Period:', result.period);
  });

  test('should parse transactions correctly', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    expect(result.transactions.length).toBeGreaterThan(0);

    // Check first transaction structure
    const firstTransaction = result.transactions[0];
    expect(firstTransaction).toHaveProperty('date');
    expect(firstTransaction).toHaveProperty('description');
    expect(firstTransaction).toHaveProperty('amount');
    expect(firstTransaction).toHaveProperty('type');
    expect(firstTransaction).toHaveProperty('currency');
    expect(firstTransaction).toHaveProperty('hash');

    console.log('First transaction:', firstTransaction);
  });

  test('should parse transaction amounts correctly', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    for (const txn of result.transactions) {
      expect(typeof txn.amount).toBe('number');
      expect(txn.amount).toBeGreaterThan(0);
    }
  });

  test('should extract card number if present', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    if (result.cardNumber) {
      expect(typeof result.cardNumber).toBe('string');
      console.log('Card number:', result.cardNumber);
    }
  });

  test('should parse transaction dates as Date objects', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    for (const txn of result.transactions) {
      expect(txn.date).toBeInstanceOf(Date);
      expect(txn.date.getTime()).not.toBeNaN();
    }
  });

  test('should categorize transactions as income or expense', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    for (const txn of result.transactions) {
      expect(['income', 'expense']).toContain(txn.type);
    }

    console.log('Transaction types:', {
      income: result.transactions.filter((t) => t.type === 'income').length,
      expense: result.transactions.filter((t) => t.type === 'expense').length,
    });
  });

  test('should generate unique hash for each transaction', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    const hashes = result.transactions.map((t) => t.hash);
    const uniqueHashes = new Set(hashes);

    expect(uniqueHashes.size).toBe(hashes.length);
  });

  test('should parse currency correctly (UAH for Privat)', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    for (const txn of result.transactions) {
      expect(txn.currency).toBe('UAH');
    }
  });

  test('should handle multi-line descriptions', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    // Check if any transaction has a description
    const hasDescriptions = result.transactions.some(
      (t) => t.description && t.description.length > 0
    );

    expect(hasDescriptions).toBe(true);
  });

  test('should maintain chronological order', async () => {
    const result = await parsePrivatPDF(pdfBuffer);

    if (result.transactions.length > 1) {
      for (let i = 1; i < result.transactions.length; i++) {
        const prevDate = result.transactions[i - 1].date.getTime();
        const currDate = result.transactions[i].date.getTime();

        // Dates should be in order (or equal for same-day transactions)
        expect(currDate).toBeGreaterThanOrEqual(prevDate);
      }
    }
  });
});
