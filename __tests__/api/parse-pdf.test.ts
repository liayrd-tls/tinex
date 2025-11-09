import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { POST } from '@/app/api/parse-pdf/route';
import { NextRequest } from 'next/server';

describe('Parse PDF API Route', () => {
  let pdfBuffer: Buffer;

  beforeAll(() => {
    // Load the test PDF file
    const pdfPath = join(process.cwd(), 'trustee_statement.pdf');
    pdfBuffer = readFileSync(pdfPath);
  });

  test('should accept PDF file and return parsed transactions', async () => {
    // Create a mock file
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const file = new File([blob], 'trustee_statement.pdf', { type: 'application/pdf' });

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });

    // Call the API route
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.transactions).toBeDefined();
    expect(Array.isArray(data.data.transactions)).toBe(true);

    console.log('API Response:', {
      success: data.success,
      transactionCount: data.data.transactions.length,
      period: data.data.period,
      cardNumber: data.data.cardNumber,
    });
  });

  test('should return 400 if no file is provided', async () => {
    // Create FormData without file
    const formData = new FormData();

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });

    // Call the API route
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('No file provided');
  });

  test('should return 500 if invalid PDF is provided', async () => {
    // Create a mock invalid file
    const invalidBuffer = Buffer.from('not a valid pdf file');
    const blob = new Blob([invalidBuffer], { type: 'application/pdf' });
    const file = new File([blob], 'invalid.pdf', { type: 'application/pdf' });

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });

    // Call the API route
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  test('should serialize dates correctly for JSON response', async () => {
    // Create a mock file
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const file = new File([blob], 'trustee_statement.pdf', { type: 'application/pdf' });

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });

    // Call the API route
    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);

    // Check that dates are serialized as strings
    const firstTransaction = data.data.transactions[0];
    expect(typeof firstTransaction.date).toBe('string');

    // Check that date string is valid ISO format
    const date = new Date(firstTransaction.date);
    expect(date.toString()).not.toBe('Invalid Date');
  });
});
