import { NextRequest, NextResponse } from 'next/server';
import { testMongoDBConnection } from '@/lib/mongodb-server';

// Ensure this route is only executed at runtime, not during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const result = await testMongoDBConnection();
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to connect to MongoDB' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
