import { NextRequest, NextResponse } from 'next/server';
import { getAccountGroupsHierarchy } from '@/lib/accounting/utils';

// GET - Get account groups hierarchy
export async function GET(request: NextRequest) {
  try {
    const groups = getAccountGroupsHierarchy();

    return NextResponse.json({
      success: true,
      groups,
    });
  } catch (error: any) {
    console.error('Error fetching account groups:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch account groups' },
      { status: 500 }
    );
  }
}






















