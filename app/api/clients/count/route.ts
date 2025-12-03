import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Define the connectToDatabase function
async function connectToDatabase() {
  try {
    const uri = process.env.MONGODB_URI as string;
    if (!uri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri);
    }
    
    return mongoose.connection;
  } catch (error) {
    throw error;
  }
}

export async function GET() {
  try {
    // Connect to database using our defined function
    const connection = await connectToDatabase();
    
    // Explicitly select the Units database
    const db = connection.useDb('Units');
    
    // Get the UnitsList collection
    const UnitsListCollection = db.collection('UnitsList');
    
    // Use estimatedDocumentCount which is faster and recommended
    const count = await UnitsListCollection.estimatedDocumentCount();
    
    // Log for debugging
    
    return NextResponse.json({
      success: true,
      count: count
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to count clients',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 





















