import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ 
        success: false, 
        error: 'No date provided' 
      }, { status: 400 });
    }

    const { db: defaultDb } = await connectToDatabase();
    const db = defaultDb.client.db('Employeeattendance');
    
    // Extract month and year from the date string
    const [year, month] = date.split('-');
    const collectionName = `${getMonthName(parseInt(month))}_${year}`;

    // Log the query parameters

    const records = await db
      .collection(collectionName)
      .find({ date })
      .toArray();

    // Log the found records

    return NextResponse.json({
      success: true,
      records,
      debug: { date, collectionName }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch date attendance'
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





















