import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const date = searchParams.get('date'); // Optional date parameter for specific date

    if (!month || !year) {
      return NextResponse.json({ 
        success: false, 
        error: 'Month and year are required' 
      }, { status: 400 });
    }

    const monthNumber = parseInt(month);
    const yearNumber = parseInt(year);
    
    if (isNaN(monthNumber) || isNaN(yearNumber)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid month or year' 
      }, { status: 400 });
    }

    const monthName = getMonthName(monthNumber);
    const collectionName = `${monthName}_${yearNumber}`;

    console.log(`Exporting ALL attendance records, Collection: ${collectionName}, Month: ${monthNumber}, Year: ${yearNumber}`);

    const { db: defaultDb } = await connectToDatabase();
    const db = defaultDb.client.db('Employeeattendance');
    
    // Check if collection exists
    const collections = await db.listCollections({name: collectionName}).toArray();
    if (collections.length === 0) {
      console.log(`Collection ${collectionName} does not exist`);
      return NextResponse.json({
        success: true,
        records: [],
        message: `No records found for ${monthName} ${yearNumber}`
      });
    }
    
    // Build query - NO tmsId filter to get ALL records
    let query: any = {};
    
    // Add date filter if specified
    if (date) {
      query.date = date;
    }
    
    console.log('Query:', JSON.stringify(query));
    
    // Get ALL records for the specified month/date
    const records = await db.collection(collectionName)
      .find(query)
      .sort({ date: 1, timeIn: 1 })
      .toArray();
      
    console.log(`Found ${records.length} records`);

    return NextResponse.json({
      success: true,
      records
    });

  } catch (error) {
    console.error('Error exporting attendance:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export attendance data'
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





















