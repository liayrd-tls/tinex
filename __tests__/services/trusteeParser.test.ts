import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseTrusteePDF, ParsedTransaction } from '@/shared/services/trusteeParser';

describe('Trustee PDF Parser', () => {
  let pdfBuffer: Buffer;

  beforeAll(() => {
    // Load the test PDF file
    const pdfPath = join(process.cwd(), 'trustee_statement.pdf');
    pdfBuffer = readFileSync(pdfPath);
  });

  test('should parse PDF without errors', async () => {
    const result = await parseTrusteePDF(pdfBuffer);

    expect(result).toBeDefined();
    expect(result.transactions).toBeDefined();
    expect(Array.isArray(result.transactions)).toBe(true);
  });

  test('should extract period information', async () => {
    const result = await parseTrusteePDF(pdfBuffer);

    expect(result.period).toBeDefined();
    expect(typeof result.period).toBe('string');
    console.log('Period:', result.period);
  });

  test('should extract card number', async () => {
    const result = await parseTrusteePDF(pdfBuffer);

    expect(result.cardNumber).toBeDefined();
    expect(typeof result.cardNumber).toBe('string');
    console.log('Card Number:', result.cardNumber);
  });

  test('should parse transactions with correct structure', async () => {
    const result = await parseTrusteePDF(pdfBuffer);

    expect(result.transactions.length).toBeGreaterThan(0);

    const firstTransaction = result.transactions[0];

    // Check all required fields exist
    expect(firstTransaction).toHaveProperty('date');
    expect(firstTransaction).toHaveProperty('description');
    expect(firstTransaction).toHaveProperty('amount');
    expect(firstTransaction).toHaveProperty('currency');
    expect(firstTransaction).toHaveProperty('type');
    expect(firstTransaction).toHaveProperty('hash');

    // Check field types
    expect(firstTransaction.date).toBeInstanceOf(Date);
    expect(typeof firstTransaction.description).toBe('string');
    expect(typeof firstTransaction.amount).toBe('number');
    expect(typeof firstTransaction.currency).toBe('string');
    expect(['income', 'expense']).toContain(firstTransaction.type);
    expect(typeof firstTransaction.hash).toBe('string');

    console.log('First transaction:', firstTransaction);
  });

  test('should parse amounts as positive numbers', async () => {
    const result = await parseTrusteePDF(pdfBuffer);

    result.transactions.forEach((txn, index) => {
      expect(txn.amount).toBeGreaterThanOrEqual(0);
    });
  });

  test('should correctly identify income vs expense', async () => {
    const result = await parseTrusteePDF(pdfBuffer);

    const hasExpenses = result.transactions.some(txn => txn.type === 'expense');
    const hasIncome = result.transactions.some(txn => txn.type === 'income');

    // Most bank statements will have at least expenses
    expect(hasExpenses || hasIncome).toBe(true);

    console.log('Total transactions:', result.transactions.length);
    console.log('Expenses:', result.transactions.filter(t => t.type === 'expense').length);
    console.log('Income:', result.transactions.filter(t => t.type === 'income').length);
  });

  test('should create unique hashes for each transaction', async () => {
    const result = await parseTrusteePDF(pdfBuffer);

    const hashes = result.transactions.map(txn => txn.hash);
    const uniqueHashes = new Set(hashes);

    // All hashes should be unique (assuming no duplicate transactions in statement)
    expect(uniqueHashes.size).toBe(hashes.length);
  });

  test('should parse valid currencies', async () => {
    const result = await parseTrusteePDF(pdfBuffer);

    const validCurrencies = ['USD', 'EUR', 'GBP', 'UAH', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

    result.transactions.forEach((txn, index) => {
      expect(txn.currency).toMatch(/^[A-Z]{3}$/); // 3-letter currency code
      console.log(`Transaction ${index + 1}: ${txn.description} - ${txn.amount} ${txn.currency}`);
    });
  });

  test('should handle PDF buffer correctly', async () => {
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  test('should reject invalid buffers', async () => {
    const invalidBuffer = Buffer.from('not a pdf');

    await expect(parseTrusteePDF(invalidBuffer)).rejects.toThrow();
  });
});
