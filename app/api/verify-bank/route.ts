import { NextRequest, NextResponse } from 'next/server';

const SUREPASS_API_URL = 'https://kyc-api.surepass.io/api/v1/bank-verification/';
const SUREPASS_API_KEY = process.env.SUREPASS_API_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc0MDgyMzM2OSwianRpIjoiOGI0M2QwNzctZmYzNi00OWM2LWE0MTAtODA4Njk4MmYwY2ZlIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LnRvbmRha0BzdXJlcGFzcy5pbyIsIm5iZiI6MTc0MDgyMzM2OSwiZXhwIjoyMzcxNTQzMzY5LCJlbWFpbCI6InRvbmRha0BzdXJlcGFzcy5pbyIsInRlbmFudF9pZCI6Im1haW4iLCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.zNMdcSinwT4W1EiBXwa764Xaw75tLr95Wc6RdMvd7DA';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountNumber, ifscCode } = body;
    
    if (!accountNumber || !ifscCode) {
      return NextResponse.json(
        { success: false, message: 'Account number and IFSC code are required' },
        { status: 400 }
      );
    }

    const response = await fetch(SUREPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUREPASS_API_KEY}`
      },
      body: JSON.stringify({
        "id_number": accountNumber,
        "ifsc": ifscCode,
        "ifsc_details": true
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Failed to verify bank details',
      });
    }
    
    // Extract relevant information from the response
    if (data.data?.status === "success" && data.data?.account_exists === true) {
      // Successfully verified
      return NextResponse.json({
        success: true,
        message: 'Bank account verified successfully',
        data: {
          accountHolderName: data.data.full_name || "",
          accountExists: data.data.account_exists,
          bankName: data.data.ifsc_details?.bank || "",
          branchName: data.data.ifsc_details?.branch || "",
          branchAddress: data.data.ifsc_details?.address || "",
          city: data.data.ifsc_details?.city || "",
          state: data.data.ifsc_details?.state || "",
          ifsc: data.data.ifsc_details?.ifsc || ifscCode,
          verified: true
        }
      });
    } else {
      // Verification failed or account doesn't exist
      return NextResponse.json({
        success: false,
        message: 'Bank account verification failed',
        data: {
          reason: data.data?.remarks || 'Account not found or invalid details'
        }
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
} 





















