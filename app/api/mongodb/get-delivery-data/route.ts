import { NextRequest, NextResponse } from 'next/server';
import { getDeliveryDataServer } from '@/lib/mongodb-server';

// Ensure this route is only executed at runtime, not during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const fileId = request.nextUrl.searchParams.get('fileId') || undefined;
    
    const result = await getDeliveryDataServer(fileId);
    
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
