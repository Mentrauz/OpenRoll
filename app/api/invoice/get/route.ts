import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { year, month, unit } = await req.json();
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // If all parameters are provided, fetch specific invoice
    if (year && month && unit) {
      // Format the collection name based on year
      const collectionName = `invoice_${year}`;
      
      // Find the invoice document
      const invoice = await db.collection(collectionName).findOne({
        month: month,
        'unit': unit
      });

      if (!invoice) {
        return NextResponse.json({
          success: false,
          message: 'Invoice not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        invoice
      });
    } 
    // If no parameters, return latest invoice number
    else {
      // Get all collection names that start with 'invoice_'
      const collections = await db.listCollections().toArray();
      const invoiceCollections = collections
        .map(col => col.name)
        .filter(name => name.startsWith('invoice_'));
      
      let latestInvoiceNo = 0;

      // Search through all invoice collections
      for (const collectionName of invoiceCollections) {
        const latestInvoice = await db.collection(collectionName)
          .find({}, { invoiceNo: 1 })
          .sort({ invoiceNo: -1 })
          .limit(1)
          .toArray();

        if (latestInvoice.length > 0) {
          const currentNo = parseInt(latestInvoice[0].invoiceNo);
          if (!isNaN(currentNo) && currentNo > latestInvoiceNo) {
            latestInvoiceNo = currentNo;
          }
        }
      }

      return NextResponse.json({
        success: true,
        latestInvoiceNo
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch data'
    }, { status: 500 });
  }
} 





















