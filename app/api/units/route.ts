import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import connectDB from '@/lib/db/mongodb';
import PendingChange from '@/models/PendingChange';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const data = await request.json();


    // Validate required fields
    if (!data.unitName || data.unitName.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unit name is required',
          receivedData: data
        },
        { status: 400 }
      );
    }

    // Get user session
    let userRole: string | null = null;
    let createdBy: string | null = null;
    try {
      const cookieStore = await cookies();
      const session = cookieStore.get('sessionUser');
      if (session?.value) {
        const parsed = JSON.parse(session.value);
        createdBy = parsed?.tmsId || null;
        userRole = parsed?.userRole || null;
      }
    } catch {}

    // Handle unit number
    const unitNumber = data.unitNumber !== undefined && data.unitNumber !== '' 
      ? data.unitNumber.toString() 
      : '1';

    // Format the unit name consistently - only use for new units
    const sanitizedUnitName = data.unitName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

    // Determine if this is an update or new registration
    // If _id is provided, this is an update operation
    const unitId = data._id || sanitizedUnitName;

    // Check if unit exists
    const client = await clientPromise;
    const unitsDb = client.db('Units');
    const unitsListCollection = unitsDb.collection('UnitsList');
    const existingUnit = await unitsListCollection.findOne({ _id: unitId });

    // If user is NOT admin, store in pending changes
    if (userRole !== 'admin') {
      await connectDB();

      const changeType = existingUnit ? 'unit_update' : 'unit_registration';
      const description = existingUnit 
        ? `Unit update: ${data.unitName.trim()}`
        : `New unit registration: ${data.unitName.trim()}`;

      const pendingChange = new PendingChange({
        changeType,
        status: 'pending',
        requestedBy: createdBy,
        requestedByRole: userRole || 'data-operations',
        requestedAt: new Date(),
        changeData: {
          ...data,
          unitNumber
        },
        targetCollection: 'UnitsList',
        targetDatabase: 'Units',
        targetDocumentId: existingUnit?._id?.toString(),
        description
      });
      await pendingChange.save();

      return NextResponse.json({
        success: true,
        message: existingUnit 
          ? 'Unit update submitted for admin approval' 
          : 'Unit registration submitted for admin approval',
        pending: true,
        changeId: pendingChange._id
      });
    }

    // If user IS admin, save directly
    const formattedData = {
      _id: unitId,
      type: "unit_details",
      unitNumber,
      unitName: data.unitName.trim(),
      address: data.address || '',
      state: data.state || '',
      district: data.district || '',
      supervisor: data.supervisor || '',
      phoneNumber: data.phoneNumber || '',
      gstNumber: data.gstNumber || '',
      contractStartDate: data.contractStartDate || '',
      contractEndDate: data.contractEndDate || '',
      unitType: data.unitType || 'Active',
      city: data.city || '',
      location: data.location || '',
      managerAOSupervisor: data.managerAOSupervisor || '',
      zoneName: data.zoneName || '',
      zoneGroup: data.zoneGroup || '',
      foodAmt: Boolean(data.foodAmt),
      prodAll: Boolean(data.prodAll),
      nightShiftAll: Boolean(data.nightShiftAll),
      altAward: Boolean(data.altAward),
      pfNewRule: Boolean(data.pfNewRule),
      pfBasic: Boolean(data.pfBasic),
      pfVDA: Boolean(data.pfVDA),
      pfHRA: Boolean(data.pfHRA),
      pfConv: Boolean(data.pfConv),
      pfWash: Boolean(data.pfWash),
      pfOther: Boolean(data.pfOther),
      pfAddAll: Boolean(data.pfAddAll),
      pfSplAll: Boolean(data.pfSplAll),
      esiBasic: Boolean(data.esiBasic),
      esiVDA: Boolean(data.esiVDA),
      esiHRA: Boolean(data.esiHRA),
      esiConv: Boolean(data.esiConv),
      esiWash: Boolean(data.esiWash),
      esiOther: Boolean(data.esiOther),
      esiAddAll: Boolean(data.esiAddAll),
      esiSplAll: Boolean(data.esiSplAll),
      lwfOn: data.lwfOn || "Gross Earn(Salary+OT)",
      lwfLimit: data.lwfLimit === 0 ? 0 : Number(data.lwfLimit || 31),
      lwfRate: data.lwfRate === 0 ? 0 : Number(data.lwfRate || 0.2),
      ptaxMinLimit: Number(data.ptaxMinLimit || 0),
      ptaxMaxLimit: Number(data.ptaxMaxLimit || 0),
      dateOfContract: data.dateOfContract || '',
      dateOfTer: data.dateOfTer || '',
      notes: data.notes || '',
      fcRate: Number(data.fcRate || 0),
      appNewRule: Boolean(data.appNewRule),
      monthDays: data.monthDays || 30,
      monthDaysType: data.monthDaysType || 'month',
      updatedAt: new Date().toISOString(),
      createdBy,
      updatedBy: createdBy,
      createdAt: undefined as string | undefined // Will be set for new records
    };

    if (existingUnit) {
      await unitsListCollection.updateOne(
        { _id: unitId },
        { 
          $set: {
            ...formattedData,
            createdAt: existingUnit.createdAt
          }
        }
      );
    } else {
      (formattedData as any).createdAt = formattedData.updatedAt;
      await unitsListCollection.insertOne(formattedData);
    }

    return NextResponse.json({
      success: true,
      message: existingUnit ? 'Unit updated successfully' : 'Unit registered successfully',
      pending: false
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to register/update unit',
        error: error
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('Units');
    
    // Keep existing functionality
    const unitsCollection = db.collection('UnitsList');
    const existingUnits = await unitsCollection.find({}).toArray();

    // Additionally get collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name)
      .filter(name => name !== 'UnitsList');

    // Combine both sources of units, removing duplicates
    const allUnits = existingUnits.map(u => u.unitName);

    return NextResponse.json({
      success: true,
      units: allUnits
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch units' },
      { status: 500 }
    );
  }
} 





















