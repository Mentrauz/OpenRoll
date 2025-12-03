import { NextRequest, NextResponse } from 'next/server';

// API configuration - using production only
const API_URL = 'https://kyc-api.surepass.io';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { aadharNumber, otp, action, clientId } = body;
    
    
    
    // Step 1: Generate OTP
    if (action === 'generateOtp') {
      if (!aadharNumber || aadharNumber.length !== 12) {
        return NextResponse.json(
          { success: false, message: 'Invalid Aadhar number' },
          { status: 400 }
        );
      }
      
      
      
      const response = await fetch(`${API_URL}/api/v1/aadhaar-v2/generate-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUREPASS_API_TOKEN}`
        },
        body: JSON.stringify({ 
          id_number: aadharNumber
        })
      });
      
      
      
      const responseText = await response.text();
      
      
      try {
        // Try to parse as JSON
        const data = JSON.parse(responseText);
        
        if (response.ok && data.success) {
          return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            clientId: data.data?.client_id || data.client_id
          });
        } else {
          return NextResponse.json({
            success: false,
            message: data.message || 'Failed to send OTP',
            details: data,
            status: response.status
          });
        }
      } catch (e) {
        // If it's not valid JSON
        return NextResponse.json({
          success: false,
          message: 'Invalid response from API: ' + response.status + ' ' + response.statusText,
          rawResponse: responseText,
          status: response.status
        });
      }
    }
    
    // Step 2: Verify OTP
    else if (action === 'verifyOtp') {
      if (!clientId || !otp) {
        return NextResponse.json(
          { success: false, message: 'Client ID and OTP are required' },
          { status: 400 }
        );
      }
      
      
      
      const response = await fetch(`${API_URL}/api/v1/aadhaar-v2/submit-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUREPASS_API_TOKEN}`
        },
        body: JSON.stringify({ 
          client_id: clientId,
          otp: otp
        })
      });
      
      
      
      const responseText = await response.text();
      
      
      try {
        // Try to parse as JSON
        const data = JSON.parse(responseText);
        
        if (response.ok && data.success) {
          const verificationData = data.data || {};
          
          // Format address properly if it's an object
          let formattedAddress = null;
          let guardianName = null;
          let relation = null;
          
          if (verificationData.address && typeof verificationData.address === 'object') {
            // Check for care of (co) field which often contains guardian's name
            if (verificationData.address.co) {
              const coValue = verificationData.address.co;
              guardianName = coValue;
              
              // Try to determine relation from prefixes
              if (coValue.includes('S/O') || coValue.includes('s/o') || coValue.includes('SON OF')) {
                relation = 'father';
                // Extract name after prefix
                const matches = coValue.match(/[SD]\/O\s+(.*)/i) || coValue.match(/SON OF\s+(.*)/i);
                if (matches && matches[1]) {
                  guardianName = matches[1].trim();
                }
              } else if (coValue.includes('D/O') || coValue.includes('d/o') || coValue.includes('DAUGHTER OF')) {
                relation = 'father';
                const matches = coValue.match(/D\/O\s+(.*)/i) || coValue.match(/DAUGHTER OF\s+(.*)/i);
                if (matches && matches[1]) {
                  guardianName = matches[1].trim();
                }
              } else if (coValue.includes('W/O') || coValue.includes('w/o') || coValue.includes('WIFE OF')) {
                relation = 'husband';
                const matches = coValue.match(/W\/O\s+(.*)/i) || coValue.match(/WIFE OF\s+(.*)/i);
                if (matches && matches[1]) {
                  guardianName = matches[1].trim();
                }
              }
            }
            
            // Filter out empty values and join with commas
            const addressParts = Object.entries(verificationData.address)
              .filter(([key, value]) => value && key !== 'co') // Exclude co field from address
              .map(([_, value]) => value);
            
            formattedAddress = addressParts.join(', ');
          } else if (verificationData.address) {
            formattedAddress = verificationData.address;
          }
          
          // Format date from YYYY-MM-DD to DD-MM-YYYY if needed
          let formattedDob = verificationData.dob;
          if (formattedDob && formattedDob.includes('-')) {
            const [year, month, day] = formattedDob.split('-');
            if (year && month && day) {
              formattedDob = `${day}-${month}-${year}`;
            }
          }
          
          return NextResponse.json({
            success: true,
            message: 'Aadhar verification successful',
            aadharData: {
              name: verificationData.full_name || verificationData.name || null,
              gender: verificationData.gender || null,
              dob: formattedDob,
              rawDob: verificationData.dob, // Keep original format for direct use
              yob: verificationData.yob || null,
              address: formattedAddress,
              guardianName: guardianName,
              relation: relation,
              aadhaar_number: verificationData.aadhaar_number || null,
              photo_link: verificationData.photo_link || null
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            message: data.message || 'OTP verification failed',
            details: data
          });
        }
      } catch (e) {
        // If it's not valid JSON
        return NextResponse.json({
          success: false,
          message: 'Invalid response from API: ' + response.status + ' ' + response.statusText,
          rawResponse: responseText
        });
      }
    }
    
    else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}





















