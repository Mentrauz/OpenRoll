import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx-js-style';
import { Workbook, Fill, Border, Font, Alignment } from 'exceljs';

export async function GET() {
  try {
    // Create a new workbook
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // Define headers
    const headers = [
      'Employee ID',
      'Name',
      "Guardian's Name",
      'Relation',
      'DOB',
      'DOJ',
      'Bank A/C No.',
      'IFSC Code',
      'ESIC No.',
      'Basic',
      'HRA',
      'Conv.',
      'Wash. ALL',
      'Oth. All',
      'Gross Rates',
      'Aadhar Number',
      'UAN No.',
      'Unit Name'
    ];

    // Set column widths
    headers.forEach((header, i) => {
      worksheet.getColumn(i + 1).width = 15;
    });

    // Add headers to worksheet
    worksheet.addRow(headers);

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 20;

    // Define header style
    const headerStyle = {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' } // Yellow background
      },
      font: {
        bold: true,
        size: 11
      },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      },
      alignment: {
        vertical: 'middle',
        horizontal: 'center'
      }
    };

    // Apply style to header cells
    headerRow.eachCell((cell) => {
      cell.fill = headerStyle.fill as Fill;
      cell.font = headerStyle.font as Font;
      cell.border = headerStyle.border as Partial<Border>;
      cell.alignment = headerStyle.alignment as Partial<Alignment>;
    });

    // Add 50 empty rows with borders
    for (let i = 0; i < 50; i++) {
      const row = worksheet.addRow([]);
      row.height = 20;
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

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="employee_template.xlsx"'
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





















