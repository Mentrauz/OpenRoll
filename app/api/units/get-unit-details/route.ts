import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('Units');
    const { unitName } = await request.json();

    if (!unitName) {
      return NextResponse.json(
        { success: false, message: 'Unit name is required' },
        { status: 400 }
      );
    }

    const unit = await db.collection('UnitsList').findOne({ unitName });

    if (!unit) {
      return NextResponse.json(
        { success: false, message: 'Unit not found' },
        { status: 404 }
      );
    }

    // Return formatted unit details needed for invoice
    const unitDetails = {
      billTo: unit.unitName,
      partyGstin: unit.gstNumber || '',
      stateCode: unit.state || '',
      address: unit.address || '',
      district: unit.district || '',
      city: unit.city || '',
      supervisor: unit.supervisor || '',
      phoneNumber: unit.phoneNumber || '',
      contractStartDate: unit.contractStartDate || '',
      contractEndDate: unit.contractEndDate || '',
    };

    return NextResponse.json({
      success: true,
      unit: unitDetails
    });

  } catch (error) {
    console.error('Error fetching unit details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch unit details' },
      { status: 500 }
    );
  }
} 





















