import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx-js-style';
import { Workbook, Fill, Border, Font, Alignment } from 'exceljs';

export async function GET() {
  try {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // Define headers
    const headers = [
      'EMPCODE',
      'P DAY',
      'ARREAR',
      'ATT. AWARD',
      'SPL. ALL',
      'FOOD ALL',
      'Prod.ALL',
      'NIGHT ALL',
      'TRAN ALL',
      'ADV. DED',
      'UNF.DED',
      'TPA DED',
      'FOOD DED',
      'PT'
    ];

    // Set column headers
    worksheet.columns = headers.map(header => ({
      header: header,
      key: header.toLowerCase().replace(/\s+/g, '_'),
      width: 12
    }));

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      bold: true,
      color: { argb: '000000' }
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF00' } // Yellow background
    };

    // Add borders to header cells
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
    });

    // Add 50 empty rows with borders
    for (let i = 2; i <= 51; i++) {
      const row = worksheet.getRow(i);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="attendance_template.xlsx"'
      }
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate template' 
    }, { status: 500 });
  }
} 





















