import { NextRequest, NextResponse } from 'next/server';
import { getCSVFileEntriesServer } from '@/lib/mongodb-server';

// Ensure this route is only executed at runtime, not during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await getCSVFileEntriesServer();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        data: result.data 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
