import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { empId: string } }
) {
  try {
    const empId = params.empId;
    
    // Construct the path to the ESIC certificates directory
    const certificatesDir = path.join(process.cwd(), 'ESIC certificates');
    
    // Look for the file with the employee ID
    const files = await fs.readdir(certificatesDir);
    const certificateFile = files.find(file => 
      file.toLowerCase().includes(empId.toLowerCase()) && 
      file.endsWith('.pdf')
    );

    if (!certificateFile) {
      return new NextResponse('Certificate not found', { status: 404 });
    }

    // Read the PDF file
    const filePath = path.join(certificatesDir, certificateFile);
    const fileBuffer = await fs.readFile(filePath);

    // Return the PDF file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ESIC_Certificate_${empId}.pdf"`,
      },
    });

  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 