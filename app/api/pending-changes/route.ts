import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import PendingChange from '@/models/PendingChange';

/**
 * GET - List all pending changes (with optional filters)
 */
export async function GET(request: Request) {
  try {
    // Get session to check permissions
    const cookieStore = await cookies();
    const session = cookieStore.get('sessionUser');

    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(session.value);
    const userRole = sessionData.userRole;
    const id = sessionData.id;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const changeType = searchParams.get('changeType');
    const onlyMine = searchParams.get('onlyMine') === 'true';

    // Build query
    let query: any = {};

    // Non-admins can only see their own pending changes
    if (userRole !== 'admin') {
      query.requestedBy = id;
    } else if (onlyMine) {
      query.requestedBy = id;
    }

    if (status) {
      query.status = status;
    }

    if (changeType) {
      query.changeType = changeType;
    }

    const pendingChanges = await PendingChange.find(query)
      .sort({ requestedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      changes: pendingChanges
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pending changes'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
}

/**
 * POST - Create a new pending change
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('sessionUser');

    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(session.value);

    await connectDB();

    const body = await request.json();
    const {
      changeType,
      changeData,
      targetCollection,
      targetDatabase,
      targetDocumentId,
      description
    } = body;

    const pendingChange = await PendingChange.create({
      changeType,
      status: 'pending',
      requestedBy: sessionData.id,
      requestedByRole: sessionData.userRole || 'data-operations',
      requestedAt: new Date(),
      changeData,
      targetCollection,
      targetDatabase,
      targetDocumentId,
      description
    });

    return NextResponse.json({
      success: true,
      message: 'Change submitted for admin approval',
      changeId: pendingChange._id
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create pending change'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
}






















