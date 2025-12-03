import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole, ROUTE_PERMISSIONS } from '@/lib/auth/permissions'
import clientPromise from '@/lib/mongodb'

// Cache for dynamic permissions
let permissionsCache: { routePermissions: Record<string, UserRole[]> | null; lastFetch: number; version: number } = {
  routePermissions: null,
  lastFetch: 0,
  version: 0
}
const CACHE_TTL = 30000 // 30 seconds cache for performance

// Clear cache on startup to ensure fresh permissions
permissionsCache.lastFetch = 0;

async function getRoutePermissions(): Promise<Record<string, UserRole[]>> {
  const now = Date.now()

  // Check if cache needs to be invalidated
  try {
    const client = await clientPromise
    const db = client.db('Users')
    const invalidationDoc = await db.collection('Settings').findOne({ _id: 'cache-invalidation' } as any)

    if (invalidationDoc?.invalidated) {
      permissionsCache = {
        routePermissions: null,
        lastFetch: 0,
        version: permissionsCache.version + 1
      }
      await db.collection('Settings').updateOne(
        { _id: 'cache-invalidation' } as any,
        { $unset: { invalidated: 1 } }
      )
    }
  } catch (error) {
  }

  // Return cached permissions if still valid
  if (permissionsCache.routePermissions && (now - permissionsCache.lastFetch) < CACHE_TTL) {
    return permissionsCache.routePermissions
  }

  // Fetch from database
  try {
    const client = await clientPromise
    const db = client.db('Users')
    const doc = await db.collection('Settings').findOne({ _id: 'role-permissions' } as any)

    const routePerms = doc?.routePermissions || ROUTE_PERMISSIONS

    // Update cache
    permissionsCache = {
      routePermissions: routePerms,
      lastFetch: now,
      version: permissionsCache.version + 1
    }

    return routePerms
  } catch (error) {
    return ROUTE_PERMISSIONS // Fallback to static on error
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for static and API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/images') ||
    path.startsWith('/api') ||
    path === '/favicon.ico' ||
    path === '/manifest.json' ||
    path === '/sw.js'
  ) {
    return NextResponse.next();
  }

  // Define all protected routes
  const protectedRoutes = [
    '/dashboard',
    '/bulk-uploads',
    '/unit-registration',
    '/unit-updation',
    '/employee-registration',
    '/employee-updation',
    '/active-employees',
    '/attendance',
    '/salary-reports',
    '/invoice',
    '/esic-export',
    '/epf-export',
    '/lwf-export',
    '/pf-esi-export',
    '/books',
    '/account-settings',
    '/pending-approvals'
  ];

  // Public paths (accessible without auth)
  const publicPaths = ['/', '/login', '/employee-login', '/quick-attendance'];
  
  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicPath = publicPaths.includes(path);
  // Public routes that should redirect to dashboard if already authenticated
  const redirectIfAuthed = ['/', '/login'];
  const isRedirectPublic = redirectIfAuthed.includes(path);

  // Get and validate session
  const sessionCookie = request.cookies.get('sessionUser');
  let isAuthenticated = false;
  let userRole: UserRole | null = null;

  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value);
      isAuthenticated = Boolean(session.isLoggedIn);
      // Get role from session
      if (session.userRole) {
        userRole = session.userRole as UserRole;
      }
    } catch (error) {
      // Invalid session - clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('sessionUser');
      return response;
    }
  }

  // Block unauthenticated users from protected routes
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login-only public paths
  if (isAuthenticated && isRedirectPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Comprehensive role-based access control for protected routes
  if (isAuthenticated && isProtectedRoute) {
    if (!userRole) {
      // No role found - security issue, force re-login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('sessionUser');
      return response;
    }

    // Get dynamic permissions from database
    const routePermissions = await getRoutePermissions()
    
    // Check if user has permission for this specific route
    const allowedRoles = routePermissions[path]
    const hasPermission = allowedRoles ? allowedRoles.includes(userRole) : false
    
    
    if (!hasPermission) {
      // User doesn't have permission - block access and redirect to dashboard
      const redirectUrl = new URL('/dashboard', request.url);
      redirectUrl.searchParams.set('error', 'access_denied');
      redirectUrl.searchParams.set('attempted_route', path);
      return NextResponse.redirect(redirectUrl);
    }
    
  }

  // Block direct access to any route not explicitly defined
  if (!isPublicPath && !isProtectedRoute && path !== '/dashboard') {
    // Unknown route - redirect to dashboard if authenticated, login if not
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)'
  ]
};