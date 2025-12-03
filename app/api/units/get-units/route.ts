import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const unitsDb = client.db('Units'); // Capital U - correct database name
    const unitsCollection = unitsDb.collection('UnitsList'); // Correct collection name
    
    // Fetch all units with type "unit_details"
    const units = await unitsCollection.find({ 
      type: "unit_details" 
    }).toArray();
    
    const formattedUnits = units.map(unit => ({
      _id: unit._id,
      unitName: unit.unitName,
      unitNumber: unit.unitNumber,
      unitCode: unit.unitCode || unit.unitNumber,
      address: unit.address || '',
      state: unit.state || '',
      district: unit.district || '',
      supervisor: unit.supervisor || '',
      phoneNumber: unit.phoneNumber || '',
      gstNumber: unit.gstNumber || '',
      contractStartDate: unit.contractStartDate || '',
      contractEndDate: unit.contractEndDate || '',
      unitType: unit.unitType || 'Active',
      // Additional settings
      foodAmt: Boolean(unit.foodAmt),
      prodAll: Boolean(unit.prodAll),
      nightShiftAll: Boolean(unit.nightShiftAll),
      altAward: Boolean(unit.altAward),
      pfNewRule: Boolean(unit.pfNewRule),
      appNewRule: Boolean(unit.appNewRule),
      // PF Settings
      pfBasic: Boolean(unit.pfBasic),
      pfVDA: Boolean(unit.pfVDA),
      pfHRA: Boolean(unit.pfHRA),
      pfConv: Boolean(unit.pfConv),
      pfWash: Boolean(unit.pfWash),
      pfOther: Boolean(unit.pfOther),
      pfAddAll: Boolean(unit.pfAddAll),
      pfSplAll: Boolean(unit.pfSplAll),
      // ESI Settings
      esiBasic: Boolean(unit.esiBasic),
      esiVDA: Boolean(unit.esiVDA),
      esiHRA: Boolean(unit.esiHRA),
      esiConv: Boolean(unit.esiConv),
      esiWash: Boolean(unit.esiWash),
      esiOther: Boolean(unit.esiOther),
      esiAddAll: Boolean(unit.esiAddAll),
      esiSplAll: Boolean(unit.esiSplAll),
      // LWF Settings
      lwfOn: unit.lwfOn || 'Gross Earn(Salary+OT)',
      lwfLimit: Number(unit.lwfLimit || 31),
      lwfRate: Number(unit.lwfRate || 0.2),
      // Professional Tax Settings
      ptaxMinLimit: Number(unit.ptaxMinLimit || 0),
      ptaxMaxLimit: Number(unit.ptaxMaxLimit || 0),
      // Other Fields
      dateOfContract: unit.dateOfContract || '',
      dateOfTer: unit.dateOfTer || '',
      notes: unit.notes || '',
      fcRate: Number(unit.fcRate || 0),
      // Month Days Settings
      monthDays: Number(unit.monthDays || 31),
      monthDaysType: unit.monthDaysType || 'month',
      // Legacy fields for backward compatibility
      districtOrState: unit.districtOrState || '',
      supervisorName: unit.supervisorName || '',
      serviceCharge: unit.serviceCharge || 0,
      salaryCalculations: unit.salaryCalculations || '',
      LWF: unit.LWF || false
    }));
    
    return NextResponse.json(
      {
        success: true,
        units: formattedUnits
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate', // No caching to ensure fresh data
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch units' 
      },
      { status: 500 }
    );
  }
} 





















