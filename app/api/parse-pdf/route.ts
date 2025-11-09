import { NextRequest, NextResponse } from 'next/server';
import { parseTrusteePDF } from '@/shared/services/trusteeParser';

/**
 * POST /api/parse-pdf
 * Parses a Trustee bank statement PDF and returns transactions
 */
export async function POST(request: NextRequest) {
  try {
    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the PDF
    const statementData = await parseTrusteePDF(buffer);

    return NextResponse.json({
      success: true,
      data: statementData,
    });
  } catch (error) {
    console.error('PDF parsing error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse PDF',
      },
      { status: 500 }
    );
  }
}
