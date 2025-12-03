import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import PendingChange from '@/models/PendingChange';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { unit, employee, originalEmpId } = body;

    // Validate required fields
    if (!unit || !employee || !employee.empId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        {
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // Get user session
    let userRole: string | null = null;
    let actor: string | null = null;
    try {
      const cookieStore = await cookies();
      const session = cookieStore.get('sessionUser');
      if (session?.value) {
        const parsed = JSON.parse(session.value);
        actor = parsed?.id || null;
        userRole = parsed?.userRole || null;
      }
    } catch { }

    // Format unit name to match collection naming
    const formatUnitName = (unitName: string) => {
      return unitName
        .replace(/\s*LTD\.\s*\(R&D\)/i, ' LTD._(R&D)')
        .replace(/\s+/g, '_')
        .toUpperCase();
    };

    const unitId = formatUnitName(employee.unitName);

    // If user is NOT admin, store in pending changes
    if (userRole !== 'admin') {
      await connectDB();

      // Get existing employee to show what's changing
      const { db } = await connectToDatabase('Employees');
      const collection = db.collection(unitId);
      const existing = await collection.findOne({ empId: originalEmpId });

      const pendingChange = await PendingChange.create({
        changeType: 'employee_update',
        status: 'pending',
        requestedBy: actor,
        requestedByRole: userRole || 'data-operations',
        requestedAt: new Date(),
        changeData: employee,
        targetCollection: unitId,
        targetDatabase: 'Employees',
        targetDocumentId: existing?._id?.toString(),
        description: `Employee update: ${employee.name || employee.empId} (${originalEmpId})`
      });

      return NextResponse.json({
        success: true,
        message: 'Employee update submitted for admin approval',
        pending: true,
        changeId: pendingChange._id,
        updatedBy: actor
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    // If user IS admin, update directly
    const { db } = await connectToDatabase('Employees');
    const collection = db.collection(unitId);

    // Fetch existing record to compute changes
    const existing = await collection.findOne({ empId: originalEmpId });

    // Create update document
    const updateDoc = {
      $set: {
        empId: employee.empId,
        name: employee.name,
        gender: employee.gender,
        dob: employee.dob,
        guardianName: employee.guardianName,
        relation: employee.relation,
        maritalStatus: employee.maritalStatus,
        unitName: employee.unitName,
        doj: employee.doj,
        basic: employee.basic,
        hra: employee.hra,
        conv: employee.conv,
        washAll: employee.washAll,
        othAll: employee.othAll,
        grossRate: employee.grossRate,
        esicNumber: employee.esicNumber,
        uanNumber: employee.uanNumber,
        lwfId: employee.lwfId,
        mobileNumber: employee.mobileNumber,
        aadharNumber: employee.aadharNumber,
        aadharName: employee.aadharName,
        bankAccount: employee.bankAccount,
        nameAsPerAadhar: employee.nameAsPerAadhar,
        ifscCode: employee.ifscCode,
        bankName: employee.bankName,
        aadharVerified: employee.aadharVerified,
        address: employee.address
      }
    };

    const now = new Date();
    (updateDoc as any).$set.updatedBy = actor;
    (updateDoc as any).$set.updatedAt = now;

    // Compute changes based on existing document
    const watchedKeys = [
      'empId', 'name', 'gender', 'dob', 'guardianName', 'relation', 'maritalStatus', 'unitName', 'doj', 'basic', 'hra', 'conv', 'washAll', 'othAll', 'grossRate', 'esicNumber', 'uanNumber', 'lwfId', 'mobileNumber', 'aadharNumber', 'aadharName', 'bankAccount', 'nameAsPerAadhar', 'ifscCode', 'bankName', 'aadharVerified', 'address'
    ];
    const changes: { field: string; from: any; to: any }[] = [];
    if (existing) {
      for (const key of watchedKeys) {
        const newVal = (updateDoc as any).$set[key];
        if (typeof newVal === 'undefined') continue;
        const oldVal = (existing as any)[key];
        // Compare as strings to avoid date/object issues
        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          changes.push({ field: key, from: oldVal ?? null, to: newVal ?? null });
        }
      }
    }
    (updateDoc as any).$set.lastChange = {
      updatedBy: actor,
      updatedAt: now,
      changes,
    };

    const result = await collection.updateOne({ empId: originalEmpId }, updateDoc);

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Employee not found'
      }, {
        status: 404,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      pending: false,
      updatedBy: actor
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to update employee'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
}

// Update POST handler to use your connection method
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase('Employees');

    const body = await request.json();
    const { empId, unitName } = body;

    if (!empId || !unitName) {
      return NextResponse.json({
        success: false,
        message: 'Employee ID and Unit Name are required'
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    // Format unit name to match collection naming - same as in PUT handler
    const formatUnitName = (unitName: string) => {
      return unitName
        .replace(/\s*LTD\.\s*\(R&D\)/i, ' LTD._(R&D)')
        .replace(/\s+/g, '_')
        .toUpperCase();
    };

    const unitId = formatUnitName(unitName);

    const result = await db.collection(unitId).deleteOne({
      empId: empId
    });


    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Employee not found'
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to delete employee'
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
}





















