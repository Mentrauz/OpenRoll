import { jsPDF } from 'jspdf';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/response';

export async function GET(
  request: Request,
  { params }: { params: { empId: string } }
) {
  try {
    const empId = await Promise.resolve(params.empId);
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return new Response('Month and year are required', { status: 400 });
    }

    const client = await clientPromise;
    const processSalaryDb = client.db('ProcessSalary');
    const monthQuery = parseInt(month).toString();

    const salaryData = await processSalaryDb.collection(`salary_${year}`).findOne({
      month: monthQuery,
      "units.records": {
        $elemMatch: {
          empId: empId
        }
      }
    });

    if (!salaryData) {
      return new Response('Salary data not found', { status: 404 });
    }

    const unitData = salaryData.units.find((unit: any) => 
      unit.records.some((record: any) => record.empId === empId)
    );

    if (!unitData) {
      return new Response('Employee not found in salary data', { status: 404 });
    }

    const employeeRecord = unitData.records.find((record: any) => 
      record.empId === empId
    );

    // Create PDF in landscape mode
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const startY = 15;
    const startX = 10;

    // Define column widths with stacked headers - adjusted to prevent overlapping
    const columns = [
      { header: ['Sr.','No.'], width: 6, align: 'center' },
      { header: ['EmpID'], width: 18, align: 'center' },
      { header: ['Employee Name', 'Guardian Name'], width: 35, align: 'center' },
      { header: ['ESI No.', 'Adhar No.', 'UAN No.'], width: 25, align: 'center' },
      { header: ['P.', 'Days'], width: 8, align: 'center' },
      { header: ['Basic', 'HRA', 'Conv.'], width: 10, align: 'center' },
      { header: ['Oth', 'Gross'], width: 10, align: 'center' },
      { header: ['eBasic', 'eHRA', 'eConv.'], width: 15, align: 'center' },
      { header: ['Wash All.', 'Oth.All', 'Trans. All.'], width: 15, align: 'center' },
      { header: ['Prod.All.', 'Arrear', 'Att.Awd'], width: 15, align: 'center' },
      { header: ['Food All.', 'Night All.', 'Spl. All'], width: 15, align: 'center' },
      { header: ['Gross', 'Earning'], width: 15, align: 'center' },
      { header: ['PF', 'ESI', 'LWF'], width: 15, align: 'center' },
      { header: ['Advance', 'Unf Ded', 'PT'], width: 15, align: 'center' },
      { header: ['Food Ded', 'TPA'], width: 15, align: 'center' },
      { header: ['Total', 'Ded'], width: 15, align: 'center' },
      { header: ['Net', 'Pay'], width: 17, align: 'center' }
    ];

    // Company Header - adjusted for landscape
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("YOUR COMPANY NAME.", startX, startY);
    doc.text("Form No. 16", 230, startY);

    doc.setFontSize(8);
    doc.text("(Prescribed Under Rule 77(2)(6))", 230, startY + 6);
    doc.text("NAME OF PRINCIPLE EMPLOYER", 230, startY + 12);
    doc.text("YOUR COMPANY NAME.", 230, startY + 18);

    // Company Details
    doc.setFontSize(10);
    doc.text(`Comp. ESINO.-6900069621001019`, startX, startY + 10);
    doc.text(`Comp. PF NO. -GNGGN253379800`, startX, startY + 16);
    doc.text(`Salary Slip for the month of ${month}, ${year}`, startX, startY + 22);

    // Unit name
    doc.setFont('helvetica', 'bold');
    doc.text(`Unit Name: ${unitData.unit}`, startX, startY + 28);

    // Table
    const tableTop = startY + 35;
    doc.setFontSize(6.5); // Small font size to prevent overlapping
    doc.setFont('helvetica', 'normal');

    // Draw table outline with adjusted total width
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    doc.rect(startX, tableTop, totalWidth, 35);

    // Draw headers with improved spacing
    let currentX = startX;
    let currentY = tableTop + 4;

    columns.forEach(col => {
      doc.line(currentX, tableTop, currentX, tableTop + 35);

      // Draw header text with improved spacing
      col.header.forEach((text, index) => {
        const xPos = col.align === 'center'
          ? currentX + (col.width / 2)
          : currentX + 1;
        
        // Split text into multiple lines if too long
        if (text.length > 8 && col.width < 15) {
          const words = text.split(' ');
          let line = '';
          let yOffset = 0;
          
          words.forEach((word, i) => {
            if (line.length + word.length > 8) {
              doc.text(
                line,
                xPos,
                currentY + (index * 4) + yOffset,
                { align: col.align }
              );
              yOffset += 3;
              line = word;
            } else {
              line += (i === 0 ? '' : ' ') + word;
            }
          });
          
          if (line) {
            doc.text(
              line,
              xPos,
              currentY + (index * 4) + yOffset,
              { align: col.align }
            );
          }
        } else {
          doc.text(
            text,
            xPos,
            currentY + (index * 4),
            { align: col.align }
          );
        }
      });

      currentX += col.width;
    });

    // Draw last vertical line
    doc.line(currentX, tableTop, currentX, tableTop + 35);

    // Draw horizontal line after headers
    doc.line(startX, tableTop + 15, startX + totalWidth, tableTop + 15);

    // Draw employee data with improved spacing
    currentX = startX;
    currentY = tableTop + 22;

    const rowData = [
      ['1'],
      [employeeRecord.empId],
      [
        employeeRecord.name,
        employeeRecord.guardianName || ''
      ],
      [
        employeeRecord.esiNumber || employeeRecord.esicNumber || '',
        employeeRecord.aadharNumber || '',
        employeeRecord.uanNumber || employeeRecord.uan || ''
      ],
      [employeeRecord.payDays?.toString() || ''],
      [
        employeeRecord.standard?.basic?.toString() || '0',
        employeeRecord.standard?.hra?.toString() || '0',
        employeeRecord.standard?.conveyance?.toString() || '0'
      ],
      [
        employeeRecord.standard?.other?.toString() || '0',
        employeeRecord.standard?.gross?.toString() || '0'
      ],
      [
        employeeRecord.earnings?.basic?.toString() || '0',
        employeeRecord.earnings?.hra?.toString() || '0',
        employeeRecord.earnings?.conv?.toString() || '0'
      ],
      [
        employeeRecord.earnings?.washAll?.toString() || '0',
        employeeRecord.earnings?.othAll?.toString() || '0',
        employeeRecord.earnings?.tranAll?.toString() || '0'
      ],
      [
        employeeRecord.earnings?.prodAll?.toString() || '0',
        employeeRecord.earnings?.arrear?.toString() || '0',
        employeeRecord.earnings?.attAward?.toString() || '0'
      ],
      [
        employeeRecord.earnings?.foodAll?.toString() || '0',
        employeeRecord.earnings?.nightAll?.toString() || '0',
        employeeRecord.earnings?.splAll?.toString() || '0'
      ],
      [employeeRecord.earnings?.grossEarnings?.toString() || '0'],
      [
        employeeRecord.deductions?.pf?.toString() || '0',
        employeeRecord.deductions?.esic?.toString() || '0',
        employeeRecord.deductions?.lwf?.toString() || '0'
      ],
      [
        employeeRecord.deductions?.advDed?.toString() || '0',
        employeeRecord.deductions?.unfDed?.toString() || '0',
        employeeRecord.deductions?.pt?.toString() || '0'
      ],
      [
        employeeRecord.deductions?.foodDed?.toString() || '0',
        employeeRecord.deductions?.tpaDed?.toString() || '0'
      ],
      [employeeRecord.deductions?.totalDeductions?.toString() || '0'],
      [(employeeRecord.netPayable || '0').toString()]
    ];

    rowData.forEach((cellData, colIndex) => {
      const col = columns[colIndex];
      
      cellData.forEach((value, rowIndex) => {
        const xPos = col.align === 'center'
          ? currentX + (col.width / 2)
          : currentX + 1;
        
        // Format numbers without commas
        let displayValue = value.toString();
        if (!isNaN(value) && value !== '') {
          displayValue = parseInt(value).toString(); // Removed toLocaleString
        }

        // Split long text into multiple lines if needed
        if (displayValue.length > 8 && col.width < 15) {
          const lines = displayValue.match(/.{1,8}/g) || [];
          lines.forEach((line, i) => {
            doc.text(
              line,
              xPos,
              currentY + (rowIndex * 4) + (i * 3),
              { align: col.align }
            );
          });
        } else {
          doc.text(
            displayValue,
            xPos,
            currentY + (rowIndex * 4),
            { align: col.align }
          );
        }
      });

      currentX += col.width;
    });

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=salary_slip_${employeeRecord.empId}_${month}_${year}.pdf`
      }
    });

  } catch (error) {
    return new Response('Failed to generate salary slip', { status: 500 });
  }
} 