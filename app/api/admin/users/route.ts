import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';

export async function GET() {
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

    const requesterRole = sessionData.userRole;
    if (requesterRole !== 'admin' && requesterRole !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('Users');
    const query: any = requesterRole === 'hr' ? { role: { $ne: 'admin' } } : {};
    const users = await db
      .collection('Admin')
      .find(query, { projection: { _id: 0, id: 1, fullName: 1, role: 1 } })
      .sort({ id: 1 })
      .toArray();

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}























