'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { hasRoutePermission, hasRoutePermissionWithConfig, UserRole } from '@/lib/auth/permissions';
import { showErrorToast } from '@/lib/toast-config';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // null = checking, true = authorized, false = unauthorized
  const [isLoading, setIsLoading] = useState(true);
  const [roleConfig, setRoleConfig] = useState<{ routePermissions?: Record<string, UserRole[]> } | undefined>(undefined);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    // Load dynamic permissions config only once and cache it
    const loadPermissions = async () => {
      if (permissionsLoaded) return; // Already loaded, skip

      try {
        // Add timeout to prevent hanging if API is slow
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout to 3 seconds

        const res = await fetch('/api/admin/permissions', {
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          setRoleConfig({ routePermissions: data.routePermissions });
        } else {
          // API failed, use static permissions
          setRoleConfig(null);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request timed out, use static permissions
          setRoleConfig(null);
        } else {
          // Network error or API not available, use static permissions
          setRoleConfig(null);
        }
      } finally {
        setPermissionsLoaded(true); // Mark as loaded regardless of success/failure
      }
    };

    loadPermissions();
  }, [permissionsLoaded]);

  useEffect(() => {
    const checkAccess = () => {
      try {
        // Get user role from session
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('sessionUser='));

        if (!sessionCookie) {
          // No session - redirect to login
          router.replace('/login');
          return;
        }

        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));

        // Check if session is expired (24 hours)
        const sessionAge = Date.now() - (sessionData.timestamp || 0);
        const isExpired = sessionAge > 24 * 60 * 60 * 1000; // 24 hours

        if (!sessionData.isLoggedIn || isExpired) {
          // Not logged in or session expired - redirect to login
          showErrorToast('Session expired. Please log in again.');
          router.replace('/login');
          return;
        }

        const userRole = sessionData.userRole as UserRole;

        // For basic routes like dashboard, allow access quickly without complex permission checks
        const isBasicRoute = pathname === '/dashboard' || pathname === '/';

        if (isBasicRoute && sessionData.isLoggedIn) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        if (!userRole) {
          // Try fallback for TMS009 or default to admin
          if (sessionData.isLoggedIn && sessionData.tmsId === 'TMS009') {
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          } else if (sessionData.isLoggedIn) {
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          } else {
            // No role and not logged in - redirect to login
            showErrorToast('Session expired. Please log in again.');
            router.replace('/login');
            return;
          }
        }

        // Only check detailed permissions if we have loaded the config
        if (roleConfig !== undefined) {
          const allowed = roleConfig?.routePermissions
            ? hasRoutePermissionWithConfig(userRole, pathname, { routePermissions: roleConfig.routePermissions })
            : hasRoutePermission(userRole, pathname);

          if (userRole && !allowed) {
            // No permission - redirect to dashboard with error
            showErrorToast('Access denied. You do not have permission to view this page.');
            router.replace('/dashboard');
            return;
          }
        }

        // All checks passed
        setIsAuthorized(true);
        setIsLoading(false);

      } catch (error) {
        // Error parsing session - redirect to login
        showErrorToast('Session error. Please log in again.');
        router.replace('/login');
      }
    };

    // Check access immediately for basic validation, then re-check if permissions load
    checkAccess();
  }, [pathname, router, roleConfig]);

  // Prevent navigation to unauthorized routes
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Re-check permissions when user uses browser back/forward buttons
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionUser='));

      if (sessionCookie) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
          const userRole = sessionData.userRole as UserRole;

          if (userRole && !hasRoutePermission(userRole, window.location.pathname)) {
            event.preventDefault();
            showErrorToast('Access denied to that page.');
            router.replace('/dashboard');
          }
        } catch (error) {
          router.replace('/login');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  // Show loading state while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tms-teal mx-auto mb-4"></div>
          <p className="text-slate-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Only show access denied when we've checked and user is actually unauthorized
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-red-700 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">You do not have permission to view this page.</p>
          <button
            onClick={() => router.replace('/dashboard')}
            className="bg-tms-teal text-white px-4 py-2 rounded-md hover:bg-tms-teal/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}





















