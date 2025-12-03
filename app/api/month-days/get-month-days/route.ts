import { NextResponse } from 'next/server';

const monthsConfig = {
  '1': { name: 'January', days: 31 },
  '2': { name: 'February', days: 28 }, // Will be adjusted for leap years
  '3': { name: 'March', days: 31 },
  '4': { name: 'April', days: 30 },
  '5': { name: 'May', days: 31 },
  '6': { name: 'June', days: 30 },
  '7': { name: 'July', days: 31 },
  '8': { name: 'August', days: 31 },
  '9': { name: 'September', days: 30 },
  '10': { name: 'October', days: 31 },
  '11': { name: 'November', days: 30 },
  '12': { name: 'December', days: 31 }
};

export async function GET() {
  try {
    // Convert monthsConfig to array format expected by the frontend
    const monthDays = Object.entries(monthsConfig).map(([month, config]) => ({
      month: parseInt(month),
      days: config.days,
      name: config.name
    }));

    return NextResponse.json(
      { 
        success: true,
        monthDays 
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours since this data rarely changes
        },
      }
    );
  } catch (error) {
    console.error('Error fetching month days:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch month days' 
      },
      { status: 500 }
    );
  }
}