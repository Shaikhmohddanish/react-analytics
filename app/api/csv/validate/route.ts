import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createReadStream } from 'fs';
import Papa from 'papaparse';
import type { ParseResult, ParseError } from 'papaparse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configure body size limit
export const bodyParser = {
  sizeLimit: '50mb',
};

export async function POST(request: NextRequest) {
  try {
    // Get the file data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create a temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'temp');
    
    try {
      // Ensure temp directory exists
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
      }
      
      // Write file to disk temporarily
      const filePath = join(tempDir, `csv-test-${uuidv4()}.csv`);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      await writeFile(filePath, buffer);
      
      // Try to read and parse the file
      const fileContent = await readFile(filePath, 'utf8');
      
      // Process the CSV file
      return new Promise((resolve) => {
        Papa.parse<Record<string, any>>(fileContent, {
          header: true,
          skipEmptyLines: true,
          delimiter: '',  // Auto-detect delimiter
          delimitersToGuess: [',', '\t', ';', '|'], // Try different delimiters
          complete: (results: ParseResult<Record<string, any>>) => {
            // Return validation result
            resolve(NextResponse.json({
              success: true,
              fileName: file.name,
              fileSize: file.size,
              rowCount: results.data.length,
              headers: results.meta.fields,
              sampleRows: results.data.slice(0, 5),
              errors: results.errors,
              meta: {
                delimiter: results.meta.delimiter,
                linebreak: results.meta.linebreak,
                aborted: results.meta.aborted,
                truncated: results.meta.truncated,
                cursor: results.meta.cursor
              }
            }));
          },
          error: (error: Error) => {
            resolve(NextResponse.json(
              { 
                success: false, 
                error: error.message,
                fileName: file.name,
                fileSize: file.size
              },
              { status: 400 }
            ));
          }
        });
      });
    } catch (fileError: unknown) {
      console.error('File processing error:', fileError);
      return NextResponse.json(
        { 
          success: false, 
          error: `File processing error: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`,
          fileName: file.name,
          fileSize: file.size
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('CSV validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}
