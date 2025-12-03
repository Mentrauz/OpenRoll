import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const empId = formData.get('empId') as string;

    if (!file || !empId) {
      return NextResponse.json(
        { error: 'File and Employee ID are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define the directory and file path
    const uploadDir = path.join(process.cwd(), 'ESIC certificates');
    const filePath = path.join(uploadDir, `${empId}.pdf`);

    // Write the file
    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 





















