import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const logoPath = path.join(publicDir, 'tms-logo.svg');

    // Check if file exists
    if (!fs.existsSync(logoPath)) {
      return new NextResponse('Logo not found', { status: 404 });
    }

    // Read the logo file
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Return the logo with proper headers
    return new NextResponse(logoBuffer, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving logo:', error);
    return new NextResponse('Error serving logo', { status: 500 });
  }
} 





















