import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import PendingChange from '@/models/PendingChange';

export async function POST(request: Request) {
  try {
    const { tmsId } = await request.json();

    if (!tmsId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID is required' 
      }, { status: 400 });
    }

    // Get user session
    let userRole: string | null = null;
    let markedBy: string | null = null;
    try {
      const cookieStore = await cookies();
      const session = cookieStore.get('sessionUser');
      if (session?.value) {
        const parsed = JSON.parse(session.value);
        markedBy = parsed?.tmsId || null;
        userRole = parsed?.userRole || null;
      }
    } catch {}

    const { db: defaultDb } = await connectDB();
    const db = defaultDb.client.db('Employeeattendance');
    
    // Get current date and format collection name
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const monthYear = `${getMonthName(now.getMonth() + 1)}_${now.getFullYear()}`;
    
    // Check if attendance already marked for today
    const existingRecord = await db.collection(monthYear).findOne({
      tmsId,
      date: dateString
    });

    if (existingRecord) {
      return NextResponse.json({
        success: false,
        error: 'Attendance already marked for today'
      }, { status: 400 });
    }

    // If user is NOT admin, store in pending changes
    if (userRole !== 'admin') {
      await connectDB();

      const pendingChange = await PendingChange.create({
        changeType: 'attendance_mark',
        status: 'pending',
        requestedBy: markedBy,
        requestedByRole: userRole || 'data-operations',
        requestedAt: now,
        changeData: {
          tmsId,
          date: dateString,
          timeIn: now.toISOString(),
          status: 'present',
          monthYear
        },
        targetCollection: monthYear,
        targetDatabase: 'Employeeattendance',
        description: `Attendance mark for ${tmsId} on ${dateString}`
      });

      return NextResponse.json({
        success: true,
        message: 'Attendance submitted for admin approval',
        pending: true,
        changeId: pendingChange._id
      });
    }

    // If user IS admin, mark directly
    await db.collection(monthYear).insertOne({
      tmsId,
      date: dateString,
      timeIn: now.toISOString(),
      status: 'present',
      markedBy
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      pending: false
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to mark attendance'
    }, { status: 500 });
  }
}

function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1];
} 





















