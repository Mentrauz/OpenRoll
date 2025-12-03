import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmsId = searchParams.get('tmsId');

    if (!tmsId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No TMSID provided' 
      }, { status: 400 });
    }

    const { db: defaultDb } = await connectToDatabase();
    // Explicitly connect to Employeeattendance database
    const db = defaultDb.client.db('Employeeattendance');
    
    const today = new Date().toISOString().split('T')[0];
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const collectionName = `${getMonthName(month)}_${year}`;

    const attendance = await db.collection(collectionName).findOne({
      tmsId: tmsId,
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





















