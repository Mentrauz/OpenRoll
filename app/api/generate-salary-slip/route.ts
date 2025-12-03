import { jsPDF } from 'jspdf';
import clientPromise from '@/lib/mongodb';

async function fetchSalaryData(unit: string, month: string, year: string) {
  try {
    const client = await clientPromise;
    const db = client.db("ProcessSalary");
    
  const collectionName = `salary_${year}`;
    
    // Format the unit name by replacing underscores with spaces
  const formattedUnit = unit.replace(/_/g, ' ');

    const salaryData = await db.collection(collectionName).findOne({
      month: month,
      "units": {
        $elemMatch: {
          unit: formattedUnit  // Using the formatted unit name
        }
      }
    });

  

    if (!salaryData) {
      return null;
    }

    // Find the correct unit data using formatted name
    const unitData = salaryData.units.find((u: any) => u.unit === formattedUnit);
    if (!unitData) {
      return null;
    }

    return {
      ...salaryData,
      units: [unitData]
    };
  } catch (error) {
    console.error('Error fetching salary data:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { unit, month, year } = await req.json();
    
    // Convert month to match database format (remove leading zero and ensure string)
    const monthQuery = parseInt(month).toString();
    

    // Get the unit data from UnitsList first
    const client = await clientPromise;
    const unitsDb = client.db('Units');
    const processSalaryDb = client.db('ProcessSalary');

    // Get unit configuration
    const unitConfig = await unitsDb.collection('UnitsList').findOne({ _id: unit });
    if (!unitConfig) {
      console.error('Unit not found:', unit);
      return new Response(JSON.stringify({ error: 'Unit not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }


    // Get salary data using unit name from config and converted month format
    const salaryCollection = processSalaryDb.collection(`salary_${year}`);
    const salaryData = await salaryCollection.findOne({ 
      month: monthQuery  // Use the converted month format
    });

    if (!salaryData) {
      console.error('No salary data found for:', { monthQuery, year });
      return new Response(JSON.stringify({ 
        error: `No salary data found for ${month}/${year}` 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the specific unit's data using unitConfig.unitName
    const unitData = salaryData.units.find((u: any) => u.unit === unitConfig.unitName);
    
    if (!unitData) {
      console.error('Available units:', salaryData.units.map((u: any) => u.unit));
      console.error('Looking for unit:', unitConfig.unitName);
      return new Response(JSON.stringify({ 
        error: `No salary data found for unit ${unitConfig.unitName}` 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create PDF with the correct unit data
    const doc = new jsPDF();
    
    // Define startY for positioning
    const startY = 15;  // Add this line to define startY
    // Calculate how many pages we need (3 employees per page)
    const totalEmployees = unitData.records.length;
    const employeesPerPage = 3;
    
    // Define column widths with stacked headers - adjusted widths to be more compact
    const columns = [
      { header: ['Sr.','No.'], width: 6, align: 'center' },
      { header: ['EmpID'], width: 15, align: 'center' },
      { header: ['Employee Name', 'Guardian Name'], width: 22, align: 'center' },
      { header: ['ESI No.', 'Adhar No.', 'UAN No.'], width: 15, align: 'center' },
      { header: ['P.', 'Days'], width: 8, align: 'center' },
      { header: ['Basic', 'HRA', 'Conv.'], width: 12, align: 'center' },
      { header: ['Oth', 'Gross'], width: 12, align: 'center' },
      { header: ['eBasic', 'eHRA', 'eConv.'], width: 12, align: 'center' },
      { header: ['Wash All.', 'Oth.All', 'Trans. All.'], width: 10, align: 'center' },
      { header: ['Prod.All.', 'Arrear', 'Att.Awd'], width: 10, align: 'center' },
      { header: ['Food All.', 'Night All.', 'Spl. All'], width: 10, align: 'center' },
      { header: ['Gross', 'Earning'], width: 10, align: 'center' },
      { header: ['PF', 'ESI', 'LWF'], width: 10, align: 'center' },
      { header: ['Advance', 'Unf Ded', 'PT'], width: 12, align: 'center' },
      { header: ['Food Ded', 'TPA'], width: 10, align: 'center' },
      { header: ['Total', 'Ded'], width: 10, align: 'center' },
      { header: ['Net', 'Pay'], width: 13, align: 'center' }
    ];
    
    // Helper function to wrap text
    function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = doc.getStringUnitWidth(currentLine + ' ' + word) * doc.getFontSize() / doc.internal.scaleFactor;
        
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    }

    // Process employees in groups of 3
    for (let i = 0; i < totalEmployees; i += employeesPerPage) {
      if (i > 0) {
        doc.addPage();
      }

      // Process up to 3 employees for this page
      for (let j = 0; j < employeesPerPage && (i + j) < totalEmployees; j++) {
        const record = unitData.records[i + j];
        const yOffset = j * 90;
        const startY = 15 + yOffset;
        
        // Header for each slip
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Form No. 16", 150, startY);
        
        doc.setFontSize(8);
        doc.text("(Prescribed Under Rule 77(2)(6))", 150, startY + 6);
        
        doc.text("NAME OF PRINCIPLE EMPLOYER", 150, startY + 12);
        doc.text("TONDAK MANPOWER SERVICES.", 150, startY + 18);
        
        // Company details - Left side
        doc.text("TONDAK MANPOWER SERVICES.", 15, startY);
        doc.text(`Comp. ESINO.-6900069621001019`, 15, startY + 12);
        doc.text(`Comp. PF NO. -GNGGN253379800` , 15, startY + 18);
        doc.text(`Salary Slip for the month of ${month}, ${year}`, 15, startY + 24);
        
        // Unit name - Bold and in all headers
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);  // Slightly larger for emphasis
        doc.text(`Unit Name: ${unitConfig.unitName}`, 15, startY + 30);
        doc.setFont('helvetica', 'normal');  // Reset font style
        doc.setFontSize(8);  // Reset font size

        // Table starts here
        const tableTop = startY + 35;  // Adjusted table start position
        
        // Draw table outline
        doc.rect(
          5, 
          tableTop, 
          200, 
          15 + 20
        );

        // Draw headers
        let currentX = 5;
        let currentY = tableTop + 4;  // Initialize currentY with some padding from top

        doc.setFontSize(6);

        columns.forEach((col, colIndex) => {
          // Draw column separator
          doc.line(
            currentX, 
            tableTop, 
            currentX, 
            tableTop + 15
          );

          // Draw stacked headers
          col.header.forEach((headerText, rowIndex) => {
            const textWidth = doc.getTextWidth(String(headerText));
            const xPos = col.align === 'center' 
              ? currentX + (col.width / 2) - (textWidth / 2)
              : col.align === 'right'
              ? currentX + col.width - textWidth - 0.5  // Reduced padding
              : currentX + 0.5;  // Reduced padding
            
            doc.text(
              String(headerText), 
              xPos, 
              currentY + (rowIndex * 2)  // Reduced from 2.5 to 2
            );
          });

          currentX += col.width;
        });

        // Draw final vertical line
        doc.line(
          200, 
          tableTop, 
          200, 
          tableTop + 15
        );

        // Draw header separator
        doc.line(
          5, 
          tableTop + 15, 
          200, 
          tableTop + 15
        );

        // Draw data
        currentX = 5;
        currentY = tableTop + 15 + 4;  // Reset currentY for data rows
        

        const rowData = [
          [(i + j + 1).toString()],
          [record.empId],
          [
            record.name,
            '\n',
            record.guardianName || ''
          ],
          [
            record.esiNumber || record.esicNumber || '',
            '\n',
            record.aadharNumber || '',
            '\n',
            record.uanNumber || record.uan || ''
          ],
          [record.payDays?.toString() || ''],
          [
            record.standard?.basic?.toString() || '0',
            record.standard?.hra?.toString() || '0',
            record.standard?.conveyance?.toString() || '0'
          ],
          [
            record.standard?.other?.toString() || '0',
            record.standard?.gross?.toString() || '0'
          ],
          [
            record.earnings?.basic?.toString() || '0',
            record.earnings?.hra?.toString() || '0',
            record.earnings?.conv?.toString() || '0'
          ],
          [
            record.earnings?.washAll?.toString() || '0',
            record.earnings?.othAll?.toString() || '0',
            record.earnings?.tranAll?.toString() || '0'
          ],
          [
            record.earnings?.prodAll?.toString() || '0',
            record.earnings?.arrear?.toString() || '0',
            record.earnings?.attAward?.toString() || '0'
          ],
          [
            record.earnings?.foodAll?.toString() || '0',
            record.earnings?.nightAll?.toString() || '0',
            record.earnings?.splAll?.toString() || '0'
          ],
          [record.earnings?.grossEarnings?.toString() || '0'],
          [
            record.deductions?.pf?.toString() || '0',
            record.deductions?.esic?.toString() || '0',
            record.deductions?.lwf?.toString() || '0'
          ],
          [
            record.deductions?.advDed?.toString() || '0',
            record.deductions?.unfDed?.toString() || '0',
            record.deductions?.pt?.toString() || '0'
          ],
          [
            record.deductions?.foodDed?.toString() || '0',
            record.deductions?.tpaDed?.toString() || '0'
          ],
          [record.deductions?.totalDeductions?.toString() || '0'],
          [(record.netPayable || '0').toString()]
        ];

        console.log('Processing record:', {
          empId: record.empId,
          name: record.name,
          guardianName: record.guardianName,
          esiNumber: record.esiNumber || record.esicNumber,
          aadharNumber: record.aadharNumber,
          uanNumber: record.uanNumber || record.uan
        });

        // Dynamically calculate row height based on content
        const calculateRowHeight = (data: string[]): number => {
          const baseHeight = 8; // Base height per line
          const padding = 4;    // Padding top and bottom
          const lines = data.filter(line => line !== '\n').length;
          return baseHeight * lines + padding;
        };

        const rowHeight = Math.max(
          calculateRowHeight(rowData[2]), // Name column
          calculateRowHeight(rowData[3]), // ID numbers column
          20 // Minimum height
        );

        // Update table configuration
        const tableConfig = {
          startX: 5,
          endX: 200,
          rowHeight,
          headerHeight: 15,  // Reduced from 20
          columnSpacing: 1,  // Reduced from 2
          headerSpacing: 2,  // Reduced from 3
          fontSize: 6,  // Reduced from 5 to 4
          slipSpacing: 90  // Reduced from 100
        };

        rowData.forEach((cellData, colIndex) => {
          const col = columns[colIndex];
          
          cellData.forEach((value, rowIndex) => {
            const textWidth = doc.getTextWidth(String(value));
            const xPos = col.align === 'center'
              ? currentX + (col.width / 2) - (textWidth / 2)
              : col.align === 'right'
              ? currentX + col.width - textWidth - 0.5
              : currentX + 0.5;
            
            doc.text(
              String(value), 
              xPos, 
              currentY + (rowIndex * 2)
            );
          });

          currentX += col.width;
        });

        // Add dotted line after each employee (except last one on page)
        if (j < employeesPerPage - 1 && (i + j + 1) < totalEmployees) {
          doc.setLineDashPattern([1, 1], 0); // Set dotted line pattern
          doc.setDrawColor(128, 128, 128); // Gray color for the line
          doc.line(5, startY + 75, 205, startY + 75); // Draw dotted line
          doc.setLineDashPattern([], 0); // Reset to solid line
        }
      }
    }

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=salary_slip_${month}_${year}.pdf`
      }
    });

  } catch (error) {
    console.error('Error generating salary slip:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate salary slip' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 