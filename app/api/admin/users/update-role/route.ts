import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import type { UserRole } from '@/lib/auth/permissions';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sessionUser');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let sessionData: any;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (sessionData.userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tmsId, role } = await request.json();
    const validRoles: UserRole[] = ['admin', 'accounts', 'data-operations', 'supervisor', 'hr'];

    if (!tmsId || !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Users');
    const result = await db.collection('Admin').updateOne(
      { tmsId },
      { $set: { role } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}























