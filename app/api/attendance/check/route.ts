import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clientDate = searchParams.get('date');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'No ID provided'
      }, { status: 400 });
    }

    const { db: defaultDb } = await connectToDatabase();
    // Explicitly connect to Employeeattendance database
    const db = defaultDb.client.db('Employeeattendance');

    const today = (clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate))
      ? clientDate
      : new Date().toISOString().split('T')[0];

    const [yearStr, monthStr] = today.split('-');
    const month = Number(monthStr);
    const year = Number(yearStr);
    const collectionName = `${getMonthName(month)}_${year}`;

    const attendance = await db.collection(collectionName).findOne({
      id: id,
      date: today
    });

    return NextResponse.json({
      success: true,
      hasMarkedToday: !!attendance
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check attendance'
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





















