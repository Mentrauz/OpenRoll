import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const { unit, year, month } = await req.json();
    console.log('Received request for:', { month, year, unit });

    // Format unit name to match database collection format
    const formatUnitName = (unitName: string) => {
      return unitName
        .replace(/\s*LTD\.\s*\(R&D\)/i, ' LTD._(R&D)')  // Add space before LTD
        .replace(/\s+/g, '_')                           // Replace spaces with underscores
        .toUpperCase();                                 // Convert to uppercase
    };

    const unitId = formatUnitName(unit);
    console.log('Formatted unit name:', unitId);

    // Get total days in the month
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const totalDays = new Date(parseInt(year), monthIndex + 1, 0).getDate();
    console.log('Total days in month:', totalDays);

    // Connect to MongoDB with specific databases
    const { db: employeeDb } = await connectToDatabase('Employees');
    const { db: salaryDb } = await connectToDatabase('ProcessSalary');
    
    // Convert month name to number
    const monthNumber = (new Date(Date.parse(month + " 1, 2000")).getMonth() + 1).toString();
    console.log('Month number:', monthNumber);

    // Normalize collection/unit names
    const normalizeUnitName = (name: string) => {
      return name
        .replace(/_/g, ' ')          // Replace underscores with spaces
        .replace(/\./g, '')          // Remove dots
        .replace(/\s+/g, ' ')        // Normalize multiple spaces
        .replace(/\(|\)/g, '')       // Remove parentheses
        .replace(/limited/i, 'ltd')   // Normalize Limited/Ltd
        .trim()                      // Remove leading/trailing spaces
        .toLowerCase();              // Convert to lowercase
    };

    // Get list of collections
    const collections = await employeeDb.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    console.log('Available collections:', collectionNames);

    // Find the matching collection (case insensitive)
    const matchingCollection = collectionNames.find(name => 
      name.toLowerCase() === unitId.toLowerCase()
    );

    if (!matchingCollection) {
      console.log('Failed to match:', unitId);
      console.log('Available collections:', collectionNames);
      throw new Error(`No employee collection found for unit ${unit}`);
    }

    // Use exact collection name from database
    console.log('Using collection:', matchingCollection);
    const employees = await employeeDb
      .collection(matchingCollection)
      .find({})
      .toArray();

    console.log('Found employees:', employees.length);

    // Fetch salary data
    const salaryData = await salaryDb
      .collection(`salary_${year}`)
      .findOne({
        month: monthNumber
      });

    console.log('Found salary data:', salaryData ? 'yes' : 'no');
    if (salaryData) {
      console.log('Available units:', salaryData.units?.map(u => u.unit));
    }

    if (!salaryData || !salaryData.units) {
      throw new Error(`No salary data found for ${month} ${year}`);
    }

    // Find matching unit in salary data
    const unitData = salaryData.units.find(u => 
      normalizeUnitName(u.unit) === normalizeUnitName(unitId)
    );

    if (!unitData) {
      console.log('Available normalized unit names:', 
        salaryData.units.map(u => normalizeUnitName(u.unit))
      );
      console.log('Searching for normalized name:', normalizeUnitName(unitId));
      throw new Error(`No salary data found for unit ${unitId}`);
    }

    if (employees.length === 0) {
      throw new Error(`No employees found in collection ${matchingCollection}`);
    }

    // Calculate values and format data
    const ecrData = employees.map(emp => {
      const employeeRecord = unitData.records.find(r => r.empId === emp.empId);

      if (!employeeRecord) {
        console.log('No salary record found for employee:', emp.empId);
        return null;
      }

      // Get basic salary from earnings
      const ebasic = employeeRecord.earnings.basic;
      
      // Apply EPF cap of 15000
      const epfWages = Math.min(Number(ebasic), 15000);
      
      // Calculate EPF components using capped wages
      const epf12 = Math.round(epfWages * 0.12);
      const eps833 = Math.round(epfWages * 0.0833);
      const eps367 = Math.round(epfWages * 0.0367);

      const rawNcpDays = totalDays - employeeRecord.payDays;
      const ncpDays = rawNcpDays % 1 <= 0.5 ? 
        Math.floor(rawNcpDays) : 
        Math.ceil(rawNcpDays);

      // Trim all values and ensure no spaces before #~#
      const values = [
        (emp.uanNumber || '').trim(),
        (emp.name || '').trim(),
        employeeRecord.earnings.grossEarnings.toString().trim(),
        epfWages.toString().trim(),
        epfWages.toString().trim(),
        epfWages.toString().trim(),
        epf12.toString().trim(),
        eps833.toString().trim(),
        eps367.toString().trim(),
        ncpDays.toString().trim(),
        '0'
      ];

      // Join with #~# without any spaces
      return values.join('#~#');
    })
    .filter(Boolean)
    .join('\n');

    if (!ecrData) {
      throw new Error('No data generated for ECR file');
    }

    console.log('Generated ECR data length:', ecrData.length);

    // Format unit name for filename
    const formattedUnitName = unitId
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase();

    const headers = new Headers();
    headers.set('Content-Type', 'text/plain');
    headers.set(
      'Content-Disposition', 
      `attachment; filename="${formattedUnitName}_ECR_${month}_${year}.txt"`
    );

    return new NextResponse(ecrData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('EPF Export error:', error);
    return new NextResponse(error.message || 'Internal Server Error', {
      status: 500,
    });
  }
} 





















