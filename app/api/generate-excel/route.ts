import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx-js-style';
import { MongoClient } from 'mongodb';

export async function POST(request: Request) {
  let client;
  try {
    // Define headers first
    const headers = [
      'Sl.No',
      'Emp Code',
      'Emp Name',
      'DOJ',
      'UAN/PF No',
      'ESI No',
      'Pay Days',
      // Standard Section (Monthly Fixed)
      'Standard Basic',
      'Standard HRA',
      'Standard Conveyance',
      'Standard Other',
      'Standard Gross',
      // Earnings Section (Actual)
      'Earned Basic',
      'Earned HRA',
      'Earned Conveyance',
      'WashingAll',
      'OtherAll',
      'Production',
      'Arrear',
      'AttAward',
      'SplAll',
      'FoodAll',
      'NightAll',
      'TranAll',
      'Gross Earnings',
      // Deductions Section
      'PF',
      'ESI',
      'LWF',
      'Advance',
      'Unfded',
      'TpaDed',
      'FoodDed',
      'Total Deductions',
      'Net Payable'
    ];

    const { month, year } = await request.json();
    
    client = await MongoClient.connect(process.env.MONGODB_URI as string);
    const db = client.db('ProcessSalary');
    const salaryCollection = db.collection(`salary_${year}`);

    const salaryData = await salaryCollection.findOne({ month: month.toString() });
    
    if (!salaryData) {
      throw new Error(`No salary data found for month: ${month}, year: ${year}`);
    }

    // Process the data with separate standard and earnings sections
    const processedData = salaryData.units.flatMap((unit: any) => 
      unit.records.map((row: any, index: number) => {
        // Convert Excel serial number to date
        const doj = row.doj ? new Date((row.doj - 25569) * 86400000) : null;
        const formattedDoj = doj ? 
          `${doj.getDate().toString().padStart(2, '0')}-${(doj.getMonth() + 1).toString().padStart(2, '0')}-${doj.getFullYear()}` : '';

        return {
          'Sl.No': index + 1,
          'Emp Code': row.empId || '',
          'Emp Name': row.name || '',
          'DOJ': formattedDoj,
          'UAN/PF No': row.uan || '',
          'ESI No': row.esic || '',
          'Pay Days': row.payDays || 0,
          // Standard Section (Monthly Fixed)
          'Standard Basic': row.standard?.basic || 0,
          'Standard HRA': row.standard?.hra || 0,
          'Standard Conveyance': row.standard?.conveyance || 0,
          'Standard Other': row.standard?.other || 0,
          'Standard Gross': row.standard?.gross || 0,
          // Earnings Section (Actual)
          'Earned Basic': row.earnings?.basic || 0,
          'Earned HRA': row.earnings?.hra || 0,
          'Earned Conveyance': row.earnings?.conv || 0,
          'WashingAll': row.earnings?.washAll || 0,
          'OtherAll': row.earnings?.othAll || 0,
          'Production': row.earnings?.prodAll || 0,
          'Arrear': row.earnings?.arrear || 0,
          'AttAward': row.earnings?.attAward || 0,
          'SplAll': row.earnings?.splAll || 0,
          'FoodAll': row.earnings?.foodAll || 0,
          'NightAll': row.earnings?.nightAll || 0,
          'TranAll': row.earnings?.tranAll || 0,
          'Gross Earnings': row.earnings?.grossEarnings || 0,
          // Deductions Section
          'PF': row.deductions?.pf || 0,
          'ESI': row.deductions?.esic || 0,
          'LWF': row.deductions?.lwf || 0,
          'Advance': row.deductions?.advDed || 0,
          'Unfded': row.deductions?.unfDed || 0,
          'TpaDed': row.deductions?.tpaDed || 0,
          'FoodDed': row.deductions?.foodDed || 0,
          'Total Deductions': row.deductions?.totalDeductions || 0,
          'Net Payable': row.netPayable || 0
        };
      })
    );

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(processedData, {
      header: headers,
      skipHeader: false
    });

    // Add headers with styling
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });

    // Style the header row with #808080
    headers.forEach((_, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (!ws[cellRef]) return;

      ws[cellRef].s = {
        font: { 
          bold: true, 
          color: { rgb: "FFFFFF" }  // White text
        },
        fill: { 
          patternType: 'solid',
          fgColor: { rgb: "808080" }  // Gray background
        },
        border: {
          bottom: { style: 'thin', color: { rgb: "000000" } }
        },
        alignment: { 
          horizontal: 'center',
          vertical: 'center'
        }
      };
    });

    // Calculate totals
    const totals = headers.map(header => {
      if (['Sl.No', 'Emp Code', 'Emp Name', 'DOJ', 'UAN/PF No', 'ESI No'].includes(header)) {
        return header === 'Sl.No' ? 'Total' : '';
      }
      return processedData.reduce((sum: number, row: any) => {
        const value = Number(row[header]) || 0;
        return sum + value;
      }, 0);
    });

    // Add footer row
    const lastRow = processedData.length + 2;
    XLSX.utils.sheet_add_aoa(ws, [totals], { origin: `A${lastRow}` });

    // Style the footer row with #808080
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = 0; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: lastRow - 1, c: col });
      if (!ws[cellRef]) continue;

      ws[cellRef].s = {
        font: { 
          bold: true, 
          color: { rgb: "FFFFFF" }  // White text
        },
        fill: { 
          patternType: 'solid',
          fgColor: { rgb: "808080" }  // Gray background
        },
        border: {
          top: { style: 'thin', color: { rgb: "000000" } },
          bottom: { style: 'double', color: { rgb: "000000" } }
        },
        alignment: { 
          horizontal: 'center',
          vertical: 'center'
        }
      };
    }

    // Set column widths
    ws['!cols'] = headers.map(header => ({
      wch: header === 'Emp Name' ? 25 : 
           header === 'Emp Code' ? 15 :
           header === 'DOJ' ? 12 :
           header === 'UAN/PF No' || header === 'ESI No' ? 15 :
           12
    }));

    // Create workbook with enhanced properties
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Report');

    // Generate buffer with all styles enabled
    const excelBuffer = XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx',
      cellStyles: true,
      cellDates: true,
      compression: true
    });

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=salary_report.xlsx'
      }
    });

  } catch (error) {
    return NextResponse.json({
      message: error.message,
      stack: error.stack,
      data: error
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate Excel file',
      details: error.message
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
} 





















