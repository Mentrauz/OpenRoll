import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("Units");
    
    // Fetch all active units from UnitsList collection
    const units = await db
      .collection("UnitsList")
      .find({ 
        type: "unit_details",
        unitType: "Active"
      })
      .project({
        _id: 1,
        unitName: 1,
        unitNumber: 1
      })
      .sort({ unitNumber: 1 })
      .toArray();

    // Transform the data to match the expected format
    const formattedUnits = units.map(unit => ({
      UnitId: unit._id,
      UnitName: unit.unitName,
      UnitNumber: unit.unitNumber
    }));

    return NextResponse.json(formattedUnits);
  } catch (error) {
    return new NextResponse('Failed to fetch units', {
      status: 500,
    });
  }
} 





















