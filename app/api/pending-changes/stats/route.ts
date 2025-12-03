import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import PendingChange from '@/models/PendingChange';

/**
 * GET - Get statistics about pending changes
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('sessionUser');

    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(session.value);

    await connectDB();

    // Get counts by status
    const pendingCount = await PendingChange.countDocuments({ status: 'pending' });
    const approvedCount = await PendingChange.countDocuments({ status: 'approved' });
    const rejectedCount = await PendingChange.countDocuments({ status: 'rejected' });

    // Get counts by type (only pending)
    const typeStats = await PendingChange.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: '$changeType', count: { $sum: 1 } } }
    ]);

    // Get user's own pending changes count
    const myPendingCount = await PendingChange.countDocuments({
      status: 'pending',
      requestedBy: sessionData.id
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount
        },
        byType: typeStats,
        myPending: myPendingCount
      }
    });

  } catch (error) {
    console.error('Error fetching pending change stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics'
    }, { status: 500 });
  }
}






















