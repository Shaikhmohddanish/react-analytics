import { NextRequest, NextResponse } from 'next/server';
import { listCloudinaryFiles } from '@/lib/cloudinary-server';

export async function GET() {
  try {
    const result = await listCloudinaryFiles();
    
    if (result.success) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to list files' },
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
