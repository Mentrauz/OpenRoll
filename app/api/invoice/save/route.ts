import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { year, month, unit, invoiceData } = await req.json();
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Format the collection name based on year
    const collectionName = `invoice_${year}`;
    
    // Create a document to save with all fields
    const invoiceDocument = {
      createdAt: new Date(),
      month: month,
      unit: unit,
      date: invoiceData.date,
      billTo: invoiceData.billTo,
      address: invoiceData.address,
      invoiceNo: invoiceData.invoiceNo,
      partyGstin: invoiceData.partyGstin,
      stateCode: invoiceData.stateCode,
      services: invoiceData.services,
      deductions: invoiceData.deductions,
      totals: {
        totalEarnings: invoiceData.totalEarnings,
        totalDeductions: invoiceData.totalDeductions,
        grossTaxableAmount: invoiceData.grossTaxableAmount,
        cgstAmount: invoiceData.cgstAmount,
        sgstAmount: invoiceData.sgstAmount,
        igstAmount: invoiceData.igstAmount,
        pt: invoiceData.pt,
        grandTotal: invoiceData.grandTotal
      }
    };

    // Check if invoice exists for this month and unit
    const existingInvoice = await db.collection(collectionName).findOne({
      month: month,
      unit: unit
    });

    let result;
    if (existingInvoice) {
      // Update existing invoice
      result = await db.collection(collectionName).updateOne(
        { month: month, unit: unit },
        { $set: invoiceDocument }
      );
    } else {
      // Create new invoice
      result = await db.collection(collectionName).insertOne(invoiceDocument);
    }

    // Log the saved document for debugging

    return NextResponse.json({
      success: true,
      message: existingInvoice ? 'Invoice updated successfully' : 'Invoice saved successfully',
      invoiceId: existingInvoice ? existingInvoice._id : result.insertedId
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to save invoice'
    }, { status: 500 });
  }
} 





















