import { NextResponse } from 'next/server'
export async function GET() {
  const response = NextResponse.json({ data: 'your data' })
  
  // Add cache control headers
  response.headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  
  return response
} 





















