import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const imageName = url.searchParams.get('name');

    if (!imageName) {
      return new NextResponse('Image name is required', { status: 400 });
    }

    const publicDir = path.join(process.cwd(), 'public');
    const imagePath = path.join(publicDir, imageName);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Determine content type based on file extension
    const ext = path.extname(imageName).toLowerCase();
    const contentType = ext === '.svg' 
      ? 'image/svg+xml'
      : ext === '.png' 
        ? 'image/png' 
        : 'application/octet-stream';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Error serving image', { status: 500 });
  }
} 





















