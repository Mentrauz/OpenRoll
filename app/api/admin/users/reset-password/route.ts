import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { hashPassword } from '@/lib/auth/password-utils'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('sessionUser')
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let sessionData: any
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const requesterRole = sessionData.userRole
    if (requesterRole !== 'admin' && requesterRole !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, newPassword } = await request.json()

    if (!id || typeof id !== 'string' || !newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('Users')

    const targetUser = await db.collection('Admin').findOne({ id })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // HR can only reset non-admin users
    if (requesterRole === 'hr' && targetUser.role === 'admin') {
      return NextResponse.json({ error: 'HR cannot modify admin users' }, { status: 403 })
    }

    const hashed = await hashPassword(newPassword)

    await db.collection('Admin').updateOne(
      { id },
      { $set: { password: hashed, passwordAttempts: 0, lockoutUntil: null } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}























