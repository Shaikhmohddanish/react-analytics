import { NextRequest, NextResponse } from 'next/server';
import { markFileDeletedServer } from '@/lib/mongodb-server';

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }
    
    const result = await markFileDeletedServer(fileId);
    
    if (result.success) {
      return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to mark file as deleted' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error marking file as deleted:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
