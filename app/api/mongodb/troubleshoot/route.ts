import { NextRequest, NextResponse } from 'next/server';
import { troubleshootMongoDBConnection, getBestConnectionApproach } from '@/lib/mongodb-troubleshooter';

export async function GET() {
  try {
    // Run the troubleshooter
    const testResults = await troubleshootMongoDBConnection();
    
    // Get the best connection approach
    const recommendation = getBestConnectionApproach(testResults);
    
    // Return the results
    return NextResponse.json({
      testResults,
      recommendation,
    });
  } catch (error) {
    console.error('Error troubleshooting MongoDB connection:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
