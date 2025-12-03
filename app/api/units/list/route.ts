import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('TMSDB');
    
    // Get units using the same method as employee registration
    const units = await db.collection('Units').find(
      { _id: { $nin: ['UnitsList', 'local', 'admin', 'config'] } }
    ).toArray();

    const formattedUnits = units.map(unit => ({
      value: unit._id,
      label: unit._id.replace(/_/g, ' ')
    }));

    return NextResponse.json({
      success: true,
      units: formattedUnits
    });

  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch units' },
      { status: 500 }
    );
  }
} 





















