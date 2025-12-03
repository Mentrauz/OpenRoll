import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmsId = searchParams.get('tmsId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!tmsId) {
      return NextResponse.json({
        success: false,
        error: 'No TMSID provided'
      }, { status: 400 });
    }

    const { db: defaultDb } = await connectToDatabase();
    // Explicitly connect to Employeeattendance database
    const db = defaultDb.client.db('Employeeattendance');

    let history = [];

    if (startDate && endDate) {
      // Query multiple collections for date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const collectionsToQuery = [];

      let current = new Date(start.getFullYear(), start.getMonth(), 1);
      const endLimit = new Date(end.getFullYear(), end.getMonth(), 1);

      while (current <= endLimit) {
        const collectionName = `${getMonthName(current.getMonth() + 1)}_${current.getFullYear()}`;
        collectionsToQuery.push(collectionName);
        current.setMonth(current.getMonth() + 1);
      }

      // Query each collection and combine results
      for (const collectionName of collectionsToQuery) {
        try {
          const collectionData = await db
            .collection(collectionName)
            .find({
              tmsId,
              date: {
                $gte: startDate,
                $lte: endDate
              }
            })
            .sort({ date: -1 })
            .toArray();
          history = history.concat(collectionData);
        } catch (error) {
          // Collection might not exist, continue
          console.log(`Collection ${collectionName} not found or error:`, error);
        }
      }
    } else {
      // Default behavior - current month only
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const collectionName = `${getMonthName(currentMonth)}_${currentYear}`;

      history = await db
        .collection(collectionName)
        .find({ tmsId })
        .sort({ date: -1 })
        .toArray();
    }

    return NextResponse.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch attendance history'
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





















