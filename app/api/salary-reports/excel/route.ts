import * as XLSX from 'xlsx-js-style';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';
import { format } from 'date-fns';

export async function POST(request: Request) {
  let client;
  try {
    const { unit, month, year } = await request.json();
    
    // Convert month to match database format (remove leading zero and ensure string)
    const monthQuery = parseInt(month).toString();
    
    console.log('Generating Excel for:', { 
      unit, 
      month: monthQuery, 
      year 
    });

    client = await MongoClient.connect(process.env.MONGODB_URI as string);
    
    // First get the unit data from UnitsList to get the proper unit name
    const unitsDb = client.db('Units');
    const unitsListCollection = unitsDb.collection('UnitsList');
    const unitConfig = await unitsListCollection.findOne({ _id: unit });

    if (!unitConfig) {
      throw new Error(`Unit configuration not found: ${unit}`);
    }

    // Get salary data using the correct unit name
    const processSalaryDb = client.db('ProcessSalary');
    const salaryCollection = processSalaryDb.collection(`salary_${year}`);
    const salaryData = await salaryCollection.findOne({ 
      month: monthQuery
    });

    if (!salaryData) {
      console.log('Query params:', { month: monthQuery, year });
      throw new Error(`No salary data found for month: ${month}, year: ${year}`);
    }

    // Find the specific unit's data using unitConfig.unitName
    const unitData = salaryData.units.find((u: any) => u.unit === unitConfig.unitName);

    if (!unitData || !unitData.records) {
      console.log('Available units:', salaryData.units.map((u: any) => u.unit));
      throw new Error(`No records found for unit ${unitConfig.unitName}`);
    }

    // Fetch employees data from Employees database
    const employeesDb = client.db('Employees');
    const employeeCollection = employeesDb.collection(unit);
    const employees = await employeeCollection.find({}).toArray();

    console.log(`Found ${employees.length} employees in collection`);

    // Log the first record to verify bank details
    console.log('First record:', unitData.records[0]);
    console.log('Bank Details:', unitData.records[0]?.bankDetails);

    // Add helper function for Excel date conversion
    const formatExcelDate = (dateValue: any): string => {
      if (!dateValue) return '';
      
      try {
        // If it's a UAN/PF number format (10 digits), it's not a date
        if (typeof dateValue === 'string' && /^\d{10}$/.test(dateValue)) {
          return '';
        }

        // If it's already a date string in DD/MM/YYYY format
        if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          return dateValue;
        }

        // If it's already a date string in YYYY-MM-DD format
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateValue.split('-');
          return `${day}/${month}/${year}`;
        }

        // If it's a number (Excel date)
        if (typeof dateValue === 'number' || !isNaN(Number(dateValue))) {
          const date = new Date((Number(dateValue) - 25569) * 86400 * 1000);
          if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
        }

        // Try parsing as regular date string
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }

        console.log('Invalid date value:', dateValue);
        return '';
      } catch (error) {
        console.error('Date formatting error:', error, 'for value:', dateValue);
        return '';
      }
    };

    // Map employee records with salary data
    const processedRecords = unitData.records.map((record: any, index: number) => {
      // Find matching employee from employee collection
      const employee = employees.find(emp => emp.empId === record.empId);
      
      // Log the DOJ value for debugging
      console.log('DOJ for', record.empId, ':', record.doj, employee?.doj);
      
      return {
        'Sl.No': index + 1,
        'Emp Code': record.empId || '',
        'Emp Name': record.name || '',
        'Guardian Name': record.guardianName || '',
        'DOJ': formatExcelDate(record.doj || employee?.doj) || '',
        'UAN/PF No': record.uanNumber || employee?.uanNumber || '',
        'ESI No': record.esicNumber || employee?.esicNumber || '',
        'Aadhar No': record.aadharNumber || employee?.aadharNumber || '',
        'IFSC Code': record.bankDetails?.ifscCode || record.ifscCode || '',
        'Bank A/c No.': record.bankDetails?.accountNumber || record.bankAccount || '',
        'Pay Days': record.payDays || 0,
        'Basic': record.earnings?.basic || 0,
        'HRA': record.earnings?.hra || 0,
        'Conv': record.earnings?.conv || 0,
        'Wash All': record.earnings?.washAll || 0,
        'Oth All': record.earnings?.othAll || 0,
        'Arrear': record.earnings?.arrear || 0,
        'Att Award': record.earnings?.attAward || 0,
        'Spl All': record.earnings?.splAll || 0,
        'Food All': record.earnings?.foodAll || 0,
        'Prod All': record.earnings?.prodAll || 0,
        'Night All': record.earnings?.nightAll || 0,
        'Tran All': record.earnings?.tranAll || 0,
        'Gross Earnings': record.earnings?.grossEarnings || 0,
        'PF': record.deductions?.pf || 0,
        'ESIC': record.deductions?.esic || 0,
        'LWF': record.deductions?.lwf || 0,
        'Adv Ded': record.deductions?.advDed || 0,
        'Unf Ded': record.deductions?.unfDed || 0,
        'TPA Ded': record.deductions?.tpaDed || 0,
        'Food Ded': record.deductions?.foodDed || 0,
        'Total Deductions': record.deductions?.totalDeductions || 0,
        'Net Payable': record.netPayable || 0
      };
    });

    // Calculate totals
    const totalsRow = {
      'Sl.No': '',
      'Emp Code': 'Total',
      'Emp Name': '',
      'Guardian Name': '',
      'DOJ': '',
      'UAN/PF No': '',
      'ESI No': '',
      'Aadhar No': '',
      'IFSC Code': '',
      'Bank A/c No.': '',
      'Pay Days': processedRecords.reduce((sum, record) => sum + (record['Pay Days'] || 0), 0),
      'Basic': processedRecords.reduce((sum, record) => sum + (record['Basic'] || 0), 0),
      'HRA': processedRecords.reduce((sum, record) => sum + (record['HRA'] || 0), 0),
      'Conv': processedRecords.reduce((sum, record) => sum + (record['Conv'] || 0), 0),
      'Wash All': processedRecords.reduce((sum, record) => sum + (record['Wash All'] || 0), 0),
      'Oth All': processedRecords.reduce((sum, record) => sum + (record['Oth All'] || 0), 0),
      'Arrear': processedRecords.reduce((sum, record) => sum + (record['Arrear'] || 0), 0),
      'Att Award': processedRecords.reduce((sum, record) => sum + (record['Att Award'] || 0), 0),
      'Spl All': processedRecords.reduce((sum, record) => sum + (record['Spl All'] || 0), 0),
      'Food All': processedRecords.reduce((sum, record) => sum + (record['Food All'] || 0), 0),
      'Prod All': processedRecords.reduce((sum, record) => sum + (record['Prod All'] || 0), 0),
      'Night All': processedRecords.reduce((sum, record) => sum + (record['Night All'] || 0), 0),
      'Tran All': processedRecords.reduce((sum, record) => sum + (record['Tran All'] || 0), 0),
      'Gross Earnings': processedRecords.reduce((sum, record) => sum + (record['Gross Earnings'] || 0), 0),
      'PF': processedRecords.reduce((sum, record) => sum + (record['PF'] || 0), 0),
      'ESIC': processedRecords.reduce((sum, record) => sum + (record['ESIC'] || 0), 0),
      'LWF': processedRecords.reduce((sum, record) => sum + (record['LWF'] || 0), 0),
      'Adv Ded': processedRecords.reduce((sum, record) => sum + (record['Adv Ded'] || 0), 0),
      'Unf Ded': processedRecords.reduce((sum, record) => sum + (record['Unf Ded'] || 0), 0),
      'TPA Ded': processedRecords.reduce((sum, record) => sum + (record['TPA Ded'] || 0), 0),
      'Food Ded': processedRecords.reduce((sum, record) => sum + (record['Food Ded'] || 0), 0),
      'Total Deductions': processedRecords.reduce((sum, record) => sum + (record['Total Deductions'] || 0), 0),
      'Net Payable': processedRecords.reduce((sum, record) => sum + (record['Net Payable'] || 0), 0)
    };

    // Add totals row to processed records
    processedRecords.push(totalsRow);

    // Check if we have any records
    if (!processedRecords.length) {
      throw new Error('No salary records found to generate report');
    }

    console.log('First processed record:', processedRecords[0]);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(processedRecords);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 5 },   // Sl.No
      { wch: 15 },  // Emp Code
      { wch: 25 },  // Emp Name
      { wch: 25 },  // Guardian Name
      { wch: 12 },  // DOJ
      { wch: 15 },  // UAN/PF No
      { wch: 15 },  // ESI No
      { wch: 15 },  // Aadhar No
      { wch: 15 },  // IFSC Code
      { wch: 20 },  // Bank A/c No.
      { wch: 10 },  // Pay Days
      { wch: 12 },  // Basic
      { wch: 12 },  // HRA
      // ... rest of the columns
    ];

    // Helper function to calculate max width needed for each column
    function getMaxLength(data: any[], key: string): number {
      const headerLength = key.length;
      const maxDataLength = Math.max(
        ...data.map(row => {
          const value = row[key]?.toString() || '';
          return value.length;
        })
      );
      return Math.max(headerLength, maxDataLength) + 2; // +2 for padding
    }

    // Calculate optimal column widths
    const columnWidths = Object.keys(processedRecords[0]).map(key => ({
      wch: getMaxLength(processedRecords, key)
    }));

    // Apply minimum widths for specific columns
    columnWidths.forEach((col, index) => {
      const key = Object.keys(processedRecords[0])[index];
      
      // Set minimum widths for specific columns
      const minWidths: { [key: string]: number } = {
        'Sl.No': 6,
        'Emp Code': 10,
        'Emp Name': 15,
        'Guardian Name': 15,
        'DOJ': 10,
        'UAN/PF No': 12,
        'ESI No': 12,
        'Aadhar No': 12,
        'IFSC Code': 15,     // Added minimum width for IFSC
        'Bank A/c No.': 20,  // Added minimum width for bank account
        'Pay Days': 8,
        'Basic': 8,
        'HRA': 8,
        'Conv': 8,
        'Net Payable': 10
      };

      // Ensure column width is not less than minimum
      if (minWidths[key]) {
        col.wch = Math.max(col.wch, minWidths[key]);
      }
      
      // Cap maximum width
      col.wch = Math.min(col.wch, 30); // Maximum width of 30 characters
    });

    // Apply column widths
    ws['!cols'] = columnWidths;

    // Apply styles to header and footer
    const headerFooterStyle = {
      fill: {
        fgColor: { rgb: "D3D3D3" },
        patternType: "solid"
      },
      font: {
        bold: true,
        color: { rgb: "000000" }
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true  // Enable text wrapping
      }
    };

    const dataCellStyle = {
      alignment: {
        horizontal: "center",
        vertical: "center"
      }
    };

    // Apply styles to all cells
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        
        // Apply header style to first row
        if (row === 0) {
          ws[cellAddress].s = headerFooterStyle;
        }
        // Apply footer style to last row (totals)
        else if (row === range.e.r) {
          ws[cellAddress].s = headerFooterStyle;
        }
        // Apply centered data cell style to all other cells
        else {
          ws[cellAddress].s = dataCellStyle;
        }
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Report');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="salary_report_${unit}_${month}_${year}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Error generating salary report:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate salary report'
    }, { status: 500 });
  }
} 