import { NextRequest, NextResponse } from 'next/server';
import { storeCSVFileInfoServer } from '@/lib/mongodb-server';

export async function POST(request: NextRequest) {
  try {
    const fileInfo = await request.json();
    
    if (!fileInfo.fileName) {
      return NextResponse.json({ 
        success: false, 
        error: 'File name is required' 
      }, { status: 400 });
    }
    
    const result = await storeCSVFileInfoServer(fileInfo);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        insertedId: result.insertedId 
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
