import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ROUTE_PERMISSIONS } from '@/lib/auth/permissions'

const SETTINGS_DB = 'Users'
const SETTINGS_COLLECTION = 'Settings'
const SETTINGS_ID = 'role-permissions'

export async function GET(request: Request) {
  try {
    // Verify this is an internal request from middleware
    const internalHeader = request.headers.get('x-internal-request')
    if (internalHeader !== 'true') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const client = await clientPromise
    const db = client.db(SETTINGS_DB)
    const doc = await db.collection(SETTINGS_COLLECTION).findOne({ _id: SETTINGS_ID } as any)

    const payload = {
      routePermissions: doc?.routePermissions || ROUTE_PERMISSIONS
    }

    return NextResponse.json(payload)
  } catch (error) {
    // Return static permissions as fallback
    return NextResponse.json({ routePermissions: ROUTE_PERMISSIONS })
  }
}





















