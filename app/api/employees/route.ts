import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import connectDB from '@/lib/db/mongodb'
import PendingChange from '@/models/PendingChange'

// Helper function to convert Excel date number to Date
const excelDateToJSDate = (excelDate: number): Date => {
  const utcDays = excelDate - 25569;
  const milliseconds = utcDays * 24 * 60 * 60 * 1000;
  return new Date(milliseconds);
};

// Helper function to safely format dates
const formatDate = (dateValue: any): string => {
  if (!dateValue) return '';

  try {
    // If it's a number (Excel date), convert it
    if (typeof dateValue === 'number' || !isNaN(Number(dateValue))) {
      const date = excelDateToJSDate(Number(dateValue));
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    // If it's already a date string in DD/MM/YYYY format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateValue.split('/');
      return `${year}-${month}-${day}`;
    }

    // If it's already a date string in YYYY-MM-DD format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateValue;
    }

    // Try parsing as regular date string
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return '';
  } catch (error) {
    return '';
  }
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const unit = searchParams.get('unit');
    const search = searchParams.get('search');

    if (!unit) {
      return NextResponse.json({ error: 'Unit is required' }, { status: 400 });
    }

    const formattedUnit = unit
      .replace(/\s*LTD\.\s*\(R&D\)/i, ' LTD._(R&D)')
      .replace(/\s+/g, '_')
      .toUpperCase();

    const client = await clientPromise;
    const db = client.db('Employees');

    let query = {};
    if (search) {
      query = {
        $or: [
          { empId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const employees = await db.collection(formattedUnit)
      .find(query)
      .toArray();

    // Format dates for each employee
    const formattedEmployees = employees.map(emp => ({
      ...emp,
      dob: formatDate(emp.dob),
      doj: formatDate(emp.doj),
      _id: emp._id.toString()
    }));

    return NextResponse.json(formattedEmployees, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const employeeData = await request.json();
    const { unitName, ...employeeDetails } = employeeData;

    // Get user session
    let userRole: string | null = null;
    let createdBy: string | null = null;
    try {
      const cookieStore = await cookies();
      const session = cookieStore.get('sessionUser');
      if (session?.value) {
        const parsed = JSON.parse(session.value);
        createdBy = parsed?.id || null;
        userRole = parsed?.userRole || null;
      }
    } catch { }

    // Format collection name to match exactly "JNS_INSTRUMENTS_LTD._(HK)" pattern
    const formattedUnit = unitName
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/\.\s+/, '._')  // Replace period followed by space with ._
      .replace(/\((.*?)\)/, '($1)');  // Handle parentheses

    // If user is NOT admin, store in pending changes
    if (userRole !== 'admin') {
      await connectDB();

      const pendingChange = await PendingChange.create({
        changeType: 'employee_registration',
        status: 'pending',
        requestedBy: createdBy,
        requestedByRole: userRole || 'data-operations',
        requestedAt: new Date(),
        changeData: {
          unitName,
          ...employeeDetails
        },
        targetCollection: formattedUnit,
        targetDatabase: 'Employees',
        description: `New employee registration: ${employeeDetails.name || employeeDetails.empId} in ${unitName}`
      });

      return NextResponse.json({
        success: true,
        message: 'Employee registration submitted for admin approval',
        pending: true,
        changeId: pendingChange._id,
        createdBy
      });
    }

    // If user IS admin, save directly
    const client = await clientPromise;
    const db = client.db('Employees');
    const collection = db.collection(formattedUnit);

    const now = new Date();
    const result = await collection.insertOne({
      ...employeeDetails,
      unitName,
      createdAt: now,
      updatedAt: now,
      createdBy: createdBy,
      updatedBy: createdBy,
      lastChange: {
        updatedBy: createdBy,
        updatedAt: now,
        changes: Object.keys(employeeDetails).map(k => ({ field: k, from: null, to: (employeeDetails as any)[k] }))
      }
    });

    if (!result.insertedId) {
      return NextResponse.json({
        success: false,
        message: 'Failed to save employee data'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee registered successfully',
      pending: false,
      employeeId: result.insertedId,
      createdBy,
      createdAt: now.toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error registering employee'
    }, { status: 500 });
  }
}





















