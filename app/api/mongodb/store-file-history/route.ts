import { NextRequest, NextResponse } from 'next/server';
import { storeFileUploadHistoryServer } from '@/lib/mongodb-server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.fileName || !data.fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result = await storeFileUploadHistoryServer({
      fileName: data.fileName,
      fileSize: data.fileSize,
      cloudinaryPublicId: data.cloudinaryPublicId || null,
      cloudinaryUrl: data.cloudinaryUrl || null,
      recordCount: data.recordCount || 0,
      description: data.description
    });
    
    if (result.success) {
      return NextResponse.json({ success: true, fileId: result.insertedId });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to store file history' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error storing file upload history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
