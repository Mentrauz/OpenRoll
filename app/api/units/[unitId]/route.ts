import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    const client = await clientPromise;
    const unitsDb = client.db('Units');
    
    const unit = await unitsDb.collection('UnitsList').findOne({
      _id: params.unitId
    });

    if (!unit) {
      return NextResponse.json({
        success: false,
        message: 'Unit not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      unit
    });

  } catch (error) {
    console.error('Error fetching unit:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch unit details' },
      { status: 500 }
    );
  }
} 