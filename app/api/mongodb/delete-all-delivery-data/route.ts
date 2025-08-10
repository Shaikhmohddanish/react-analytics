import { NextRequest, NextResponse } from 'next/server';
import { deleteAllDeliveryDataServer } from '@/lib/mongodb-server';

export async function DELETE(request: NextRequest) {
  try {
    const result = await deleteAllDeliveryDataServer();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        deletedCount: result.deletedCount 
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
