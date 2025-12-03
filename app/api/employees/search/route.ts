import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// Helper function to convert Excel date number to Date
const excelDateToJSDate = (excelDate: number): Date => {
  // Excel dates are number of days since Dec 30, 1899
  const utcDays = excelDate - 25569; // Adjust for Unix epoch start (Jan 1, 1970)
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

    // If it's already a date string in YYYY-MM-DD format, return it
    if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateValue;
    }

    // Handle DD/MM/YYYY format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateValue.split('/');
      return `${year}-${month}-${day}`;
    }

    // Handle DD-MM-YYYY format
    if (typeof dateValue === 'string' && dateValue.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = dateValue.split('-');
      return `${year}-${month}-${day}`;
    }

    // Try to create a valid date from string
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    console.log('Invalid date value:', dateValue);
    return '';
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateValue);
    return '';
  }
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const unit = decodeURIComponent(searchParams.get('unit') || '');
    const empId = searchParams.get('empId');

    if (!unit || !empId) {
      return NextResponse.json({ error: 'Unit and Employee ID are required' }, { status: 400 });
    }

    // Format unit name exactly like the working endpoint
    const formattedUnit = unit
      .replace(/\s*LTD\.\s*\(R&D\)/i, ' LTD._(R&D)')
      .replace(/\s+/g, '_')
      .toUpperCase();

    console.log('Original unit:', unit);
    console.log('Formatted unit:', formattedUnit);
    console.log('Searching for employee:', empId);

    const client = await clientPromise;
    const db = client.db('Employees');

    // Debug database connection
    const collections = await db.listCollections().toArray();
    console.log('All collections in Employees db:', collections.map(c => c.name));

    const employee = await db.collection(formattedUnit)
      .findOne({ empId: empId });

    if (!employee) {
      // Log first few employees for debugging
      const sample = await db.collection(formattedUnit)
        .find({})
        .limit(2)
        .toArray();
      console.log('Sample employees:', sample.map(e => ({ id: e.empId, name: e.name })));
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Log raw date values for debugging
    console.log('Raw DOB:', employee.dob);
    console.log('Raw DOJ:', employee.doj);

    // Format dates using the helper function
    const formattedEmployee = {
      ...employee,
      dob: formatDate(employee.dob),
      doj: formatDate(employee.doj),
      _id: employee._id.toString() // Convert ObjectId to string
    };

    console.log('Found employee:', formattedEmployee);
    return NextResponse.json(formattedEmployee, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Error details:', error);
    return NextResponse.json({ 
      error: 'Failed to search employee',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 





















