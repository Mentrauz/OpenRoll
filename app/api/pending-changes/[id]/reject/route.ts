import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import PendingChange from '@/models/PendingChange';

/**
 * POST - Reject a pending change
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('sessionUser');

    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(session.value);

    // Only admins can reject changes
    if (sessionData.userRole !== 'admin') {
      return NextResponse.json({
        error: 'Only administrators can reject changes'
      }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { comments } = body;

    // Find the pending change
    const pendingChange = await PendingChange.findById(params.id);

    if (!pendingChange) {
      return NextResponse.json({
        error: 'Pending change not found'
      }, { status: 404 });
    }

    if (pendingChange.status !== 'pending') {
      return NextResponse.json({
        error: 'This change has already been processed'
      }, { status: 400 });
    }

    // Mark as rejected
    pendingChange.status = 'rejected';
    pendingChange.reviewedBy = sessionData.id;
    pendingChange.reviewedAt = new Date();
    pendingChange.reviewComments = comments || 'No reason provided';
    await pendingChange.save();

    return NextResponse.json({
      success: true,
      message: 'Change rejected successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to reject change'
    }, { status: 500 });
  }
}

