import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/user'
import { payrollSchema } from '@/lib/validation/schemas'

export async function GET() {
  try {
    await connectDB()
    const employees = await User.find({ role: 'user' })
      .select('id name department')
      .sort({ name: 1 })

    return NextResponse.json(employees, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch payroll data' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = payrollSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      )
    }

    await connectDB()

    // Verify employee exists
    const employee = await User.findById(validation.data.employeeId)
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      )
    }

    // TODO: Create PayrollEntry model and save payroll data
    return NextResponse.json(
      { message: 'Payroll entry created successfully' },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create payroll entry' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  }
}





















