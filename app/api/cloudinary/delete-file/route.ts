import { NextRequest, NextResponse } from 'next/server';
import { deleteCloudinaryFile } from '@/lib/cloudinary-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId } = body;
    
    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }
    
    const result = await deleteCloudinaryFile(publicId);
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to delete file' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
