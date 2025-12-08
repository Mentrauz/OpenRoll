import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { ROUTE_PERMISSIONS, MENU_PERMISSIONS, FEATURE_PERMISSIONS } from '@/lib/auth/permissions'

const SETTINGS_DB = 'Users'
const SETTINGS_COLLECTION = 'Settings'
const SETTINGS_ID = 'role-permissions'

export async function GET() {
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


    const client = await clientPromise
    const db = client.db(SETTINGS_DB)
    const doc = await db.collection(SETTINGS_COLLECTION).findOne({ _id: SETTINGS_ID } as any)

    // If we have route permissions but no menu permissions, sync them
    let menuPermissions = doc?.menuPermissions || MENU_PERMISSIONS;
    let routePermissions = doc?.routePermissions || ROUTE_PERMISSIONS;
    let featurePermissions = doc?.featurePermissions || FEATURE_PERMISSIONS;

    // Sync menu permissions from route permissions if needed
    if (doc?.routePermissions) {
      // Always ensure menu permissions are properly synced with route permissions for HR
      const ROUTE_TO_MENUS: Record<string, string[]> = {
        '/dashboard': ['dashboard'],
        '/attendance': ['attendance'],
        '/bulk-uploads': ['bulk-uploads'],
        '/unit-registration': ['registration', 'unit-registration'],
        '/employee-registration': ['registration', 'employee-registration'],
        '/unit-updation': ['updation', 'unit-updation'],
        '/employee-updation': ['updation', 'employee-updation'],
        '/active-employees': ['active-employees'],
        '/salary-reports': ['reports', 'salary-reports'],
        '/invoice': ['reports', 'invoice'],
        '/esic-export': ['exports', 'esic-export'],
        '/epf-export': ['exports', 'epf-export'],
        '/lwf-export': ['exports', 'lwf-export'],
        '/pf-esi-export': ['exports', 'pf-esi-export'],
        '/account-settings': ['account-settings'],
        '/pending-approvals': ['pending-approvals']
      };

      const syncMenuFromRoutes = (routes: Record<string, any>) => {
        const menuPerms: Record<string, any[]> = {};
        Object.keys(MENU_PERMISSIONS).forEach(key => {
          menuPerms[key] = [];
        });

        for (const [route, roles] of Object.entries(routes)) {
          if (roles.includes('hr')) {
            const controllingMenus = ROUTE_TO_MENUS[route] || [];
            controllingMenus.forEach(menuKey => {
              if (menuPerms[menuKey] && !menuPerms[menuKey].includes('hr')) {
                menuPerms[menuKey].push('hr');
              }
            });
          }
        }
        return menuPerms;
      };

      const syncedMenuPerms = syncMenuFromRoutes(routePermissions);

      // Update menu permissions to include HR where routes allow it
      Object.keys(syncedMenuPerms).forEach(menuKey => {
        if (syncedMenuPerms[menuKey].includes('hr') && !menuPermissions[menuKey]?.includes('hr')) {
          if (!menuPermissions[menuKey]) {
            menuPermissions[menuKey] = [];
          }
          menuPermissions[menuKey].push('hr');
        }
      });
    }

    const payload = {
      routePermissions,
      menuPermissions,
      featurePermissions
    }

    // Add cache-busting headers to prevent caching of dynamic permissions
    const response = NextResponse.json(payload);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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

    if (sessionData.userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { routePermissions, menuPermissions, featurePermissions } = body || {}

    if (!routePermissions && !menuPermissions && !featurePermissions) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(SETTINGS_DB)

    await db.collection(SETTINGS_COLLECTION).updateOne(
      { _id: SETTINGS_ID } as any,
      {
        $set: {
          ...(routePermissions ? { routePermissions } : {}),
          ...(menuPermissions ? { menuPermissions } : {}),
          ...(featurePermissions ? { featurePermissions } : {}),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    // Clear the middleware cache by setting a flag in the database
    // The middleware will check this flag and refresh its cache
    await db.collection(SETTINGS_COLLECTION).updateOne(
      { _id: 'cache-invalidation' } as any,
      {
        $set: {
          invalidated: true,
          timestamp: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
  }
}

// Debug endpoint to reset HR permissions
export async function POST() {
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


    const client = await clientPromise
    const db = client.db(SETTINGS_DB)

    // HR permissions - routes that HR should have access to
    const hrRoutePermissions = {
      '/dashboard': ['admin', 'accounts', 'data-operations', 'supervisor', 'hr'],
      '/attendance': ['admin', 'data-operations', 'supervisor', 'hr'],
      '/bulk-uploads': ['admin', 'data-operations', 'hr'],
      '/unit-registration': ['admin', 'data-operations', 'hr'],
      '/employee-registration': ['admin', 'data-operations', 'hr'],
      '/unit-updation': ['admin', 'data-operations', 'hr'],
      '/employee-updation': ['admin', 'data-operations', 'hr'],
      '/active-employees': ['admin', 'data-operations', 'supervisor', 'hr'],
      '/salary-reports': ['admin', 'accounts', 'supervisor', 'hr'],
      '/invoice': ['admin', 'accounts', 'hr'],
      '/esic-export': ['admin', 'accounts', 'hr'],
      '/epf-export': ['admin', 'accounts', 'hr'],
      '/lwf-export': ['admin', 'accounts', 'hr'],
      '/pf-esi-export': ['admin', 'accounts', 'hr'],
      '/account-settings': ['admin', 'accounts', 'data-operations', 'supervisor', 'hr'],
      '/pending-approvals': ['admin']
    };

    // HR menu permissions - derived from route permissions
    const hrMenuPermissions = {
      dashboard: ['admin', 'accounts', 'data-operations', 'supervisor', 'hr'],
      attendance: ['admin', 'data-operations', 'supervisor', 'hr'],
      'bulk-uploads': ['admin', 'data-operations', 'hr'],
      registration: ['admin', 'data-operations', 'hr'],
      'unit-registration': ['admin', 'data-operations', 'hr'],
      'employee-registration': ['admin', 'data-operations', 'hr'],
      updation: ['admin', 'data-operations', 'hr'],
      'unit-updation': ['admin', 'data-operations', 'hr'],
      'employee-updation': ['admin', 'data-operations', 'hr'],
      'active-employees': ['admin', 'data-operations', 'supervisor', 'hr'],
      reports: ['admin', 'accounts', 'supervisor', 'hr'],
      'salary-reports': ['admin', 'accounts', 'supervisor', 'hr'],
      invoice: ['admin', 'accounts', 'hr'],
      exports: ['admin', 'accounts', 'hr'],
      'esic-export': ['admin', 'accounts', 'hr'],
      'epf-export': ['admin', 'accounts', 'hr'],
      'lwf-export': ['admin', 'accounts', 'hr'],
      'pf-esi-export': ['admin', 'accounts', 'hr'],
      'account-settings': ['admin', 'accounts', 'data-operations', 'supervisor', 'hr'],
      'pending-approvals': ['admin']
    };

    await db.collection(SETTINGS_COLLECTION).updateOne(
      { _id: SETTINGS_ID } as any,
      {
        $set: {
          routePermissions: hrRoutePermissions,
          menuPermissions: hrMenuPermissions,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    // Clear the middleware cache
    await db.collection(SETTINGS_COLLECTION).updateOne(
      { _id: 'cache-invalidation' } as any,
      {
        $set: {
          invalidated: true,
          timestamp: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, message: 'HR permissions reset successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset permissions' }, { status: 500 })
  }
}





















