import { NextRequest, NextResponse } from 'next/server';
import { storeDeliveryDataServer } from '@/lib/mongodb-server';

export async function POST(request: NextRequest) {
  try {
    const { data, fileId } = await request.json();
    
    if (!data || !Array.isArray(data) || !fileId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Data array and fileId are required' 
      }, { status: 400 });
    }
    
    const result = await storeDeliveryDataServer(data, fileId);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        insertedCount: result.insertedCount 
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
