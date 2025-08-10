import { NextRequest, NextResponse } from 'next/server';
import { getDeliveryDataServer } from '@/lib/mongodb-server';

// Cache configuration
export const revalidate = 300; // Revalidate every 5 minutes
export const runtime = 'nodejs';

// In-memory cache for server-side caching
const serverCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const fileId = request.nextUrl.searchParams.get('fileId') || undefined;
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    
    // Create cache key
    const cacheKey = `delivery_data_${fileId || 'all'}`;
    
    // Check cache if not forcing refresh
    if (!forceRefresh) {
      const cached = serverCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({ 
          success: true, 
          data: cached.data,
          cached: true
        });
      }
    }
    
    const result = await getDeliveryDataServer(fileId);
    
    if (result.success) {
      // Cache the result
      serverCache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now()
      });
      
      return NextResponse.json({ 
        success: true, 
        data: result.data,
        cached: false
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
