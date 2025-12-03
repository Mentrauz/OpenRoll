import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import FinancialYear from '@/models/FinancialYear';

// GET - List all financial years
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');

    let query: any = {};
    if (unitId) {
      query.unitId = unitId;
    }

    const financialYears = await FinancialYear.find(query).sort({ startDate: -1 });

    return NextResponse.json({
      success: true,
      financialYears,
    });
  } catch (error: any) {
    console.error('Error fetching financial years:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch financial years' },
      { status: 500 }
    );
  }
}

// POST - Create new financial year
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      yearCode,
      startDate,
      endDate,
      description,
      createdBy,
      unitId,
    } = body;

    // Validate required fields
    if (!yearCode || !startDate || !endDate || !createdBy) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if year code already exists
    const existingYear = await FinancialYear.findOne({ yearCode });
    if (existingYear) {
      return NextResponse.json(
        { success: false, message: 'Financial year with this code already exists' },
        { status: 400 }
      );
    }

    // Check for overlapping dates
    const overlapping = await FinancialYear.findOne({
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    });

    if (overlapping) {
      return NextResponse.json(
        { success: false, message: 'Financial year dates overlap with existing year' },
        { status: 400 }
      );
    }

    // Create financial year
    const financialYear = new FinancialYear({
      yearCode,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description: description || '',
      createdBy,
      unitId: unitId || null,
      isActive: true,
      isClosed: false,
    });

    await financialYear.save();

    return NextResponse.json({
      success: true,
      message: 'Financial year created successfully',
      financialYear,
    });
  } catch (error: any) {
    console.error('Error creating financial year:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create financial year' },
      { status: 500 }
    );
  }
}

// PUT - Update financial year
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { _id, isActive, isClosed, description } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, message: 'Financial year ID is required' },
        { status: 400 }
      );
    }

    const financialYear = await FinancialYear.findById(_id);
    if (!financialYear) {
      return NextResponse.json(
        { success: false, message: 'Financial year not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (typeof isActive !== 'undefined') {
      // If activating this year, deactivate all others
      if (isActive) {
        await FinancialYear.updateMany(
          { _id: { $ne: _id } },
          { isActive: false }
        );
      }
      financialYear.isActive = isActive;
    }

    if (typeof isClosed !== 'undefined') {
      financialYear.isClosed = isClosed;
      if (isClosed && !financialYear.closingDate) {
        financialYear.closingDate = new Date();
      }
    }

    if (typeof description !== 'undefined') {
      financialYear.description = description;
    }

    await financialYear.save();

    return NextResponse.json({
      success: true,
      message: 'Financial year updated successfully',
      financialYear,
    });
  } catch (error: any) {
    console.error('Error updating financial year:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update financial year' },
      { status: 500 }
    );
  }
}

// DELETE - Delete financial year
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Financial year ID is required' },
        { status: 400 }
      );
    }

    const financialYear = await FinancialYear.findById(id);
    if (!financialYear) {
      return NextResponse.json(
        { success: false, message: 'Financial year not found' },
        { status: 404 }
      );
    }

    // Don't allow deletion of closed years
    if (financialYear.isClosed) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete a closed financial year' },
        { status: 400 }
      );
    }

    await FinancialYear.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Financial year deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting financial year:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete financial year' },
      { status: 500 }
    );
  }
}






















