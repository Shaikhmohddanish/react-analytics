import { NextRequest, NextResponse } from 'next/server';
import { getFileUploadHistoryServer } from '@/lib/mongodb-server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
    
    const result = await getFileUploadHistoryServer(includeDeleted);
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to retrieve file history' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error retrieving file upload history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
