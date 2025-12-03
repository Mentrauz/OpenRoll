import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { unitName, unitDetails } = await request.json();
    
    // Sanitize collection name (remove special characters and spaces)
    const collectionName = unitName.replace(/[^a-zA-Z0-9]/g, '_');
    
    const client = await clientPromise;
    const db = client.db('Units');

    // Get or create the collection
    const collection = db.collection(collectionName);

    // Check if unit details document exists
    const existingDetails = await collection.findOne({ type: 'unit_details' });

    if (existingDetails) {
      // Update existing document
      const updateResult = await collection.updateOne(
        { type: 'unit_details' },
        { 
          $set: {
            ...unitDetails,
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to update unit details');
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Collection updated successfully',
        updated: true
      });
    } else {
      // Insert new document if it doesn't exist
      await collection.insertOne({
        type: 'unit_details',
        ...unitDetails,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Collection created successfully',
        updated: false
      });
    }

  } catch (error) {
    console.error('Error creating/updating collection:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create/update collection' 
    }, { status: 500 });
  }
} 





















