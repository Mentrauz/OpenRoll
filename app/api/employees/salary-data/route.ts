import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unit = searchParams.get('unit');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!unit || !month || !year) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Employees');
    const collection = db.collection(unit);

    // Fetch employee data
    const employees = await collection.find({}).toArray();

    // TODO: Fetch attendance and salary calculation data from your database
    // This will depend on how you store attendance and salary information

    return NextResponse.json({
      success: true,
      employees: employees
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Error fetching salary data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch salary data'
    }, { status: 500 });
  }
} 





















