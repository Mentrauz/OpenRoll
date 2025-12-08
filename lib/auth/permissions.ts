export type UserRole = 'admin' | 'accounts' | 'data-operations' | 'supervisor' | 'hr';

// Define feature-specific permissions
export const FEATURE_PERMISSIONS: Record<string, UserRole[]> = {
  'attendance-visibility': ['admin', 'hr'], // Who can see all employee attendance details
  'account-settings-edit': ['admin'], // Who can edit account settings (excluding profile and security sections)
};

// Define permissions for each route
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Dashboard - accessible to all roles
  '/dashboard': ['admin', 'accounts', 'data-operations', 'supervisor', 'hr'],
  
  // Data Operations routes - accessible to admin, data-operations, and hr
  '/bulk-uploads': ['admin', 'data-operations', 'hr'],
  '/unit-registration': ['admin', 'data-operations', 'hr'],
  '/unit-updation': ['admin', 'data-operations', 'hr'],
  '/employee-registration': ['admin', 'data-operations', 'hr'],
  '/employee-updation': ['admin', 'data-operations', 'hr'],
  '/active-employees': ['admin', 'data-operations', 'supervisor', 'hr'],
  '/attendance': ['admin', 'data-operations', 'supervisor', 'hr'],
  
  // Accounts/Financial routes - accessible to admin, accounts, supervisor, and hr
  '/salary-reports': ['admin', 'accounts', 'supervisor', 'hr'],
  '/invoice': ['admin', 'accounts', 'hr'],
  '/esic-export': ['admin', 'accounts', 'hr'],
  '/epf-export': ['admin', 'accounts', 'hr'],
  '/lwf-export': ['admin', 'accounts', 'hr'],
  '/pf-esi-export': ['admin', 'accounts', 'hr'],
  
  // Settings - accessible to all authenticated users
  '/account-settings': ['admin', 'accounts', 'data-operations', 'supervisor', 'hr'],
  
  // Admin only routes
  '/pending-approvals': ['admin'],
};

// Define menu items with their required permissions
// These are the fallback defaults - dynamic permissions from database will override these
export const MENU_PERMISSIONS: Record<string, UserRole[]> = {
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
  'pending-approvals': ['admin'],
};

/**
 * Check if a user role has permission to access a specific route
 */
export function hasRoutePermission(userRole: UserRole, route: string): boolean {
  const allowedRoles = ROUTE_PERMISSIONS[route];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
}

/**
 * Check if a user role has permission to see a menu item
 */
export function hasMenuPermission(userRole: UserRole, menuKey: string): boolean {
  const allowedRoles = MENU_PERMISSIONS[menuKey];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
}

/**
 * Check if a user role has permission to access a feature
 */
export function hasFeaturePermission(userRole: UserRole, featureKey: string): boolean {
  const allowedRoles = FEATURE_PERMISSIONS[featureKey];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
}

/**
 * Get all routes accessible to a user role
 */
export function getAccessibleRoutes(userRole: UserRole): string[] {
  return Object.entries(ROUTE_PERMISSIONS)
    .filter(([_, allowedRoles]) => allowedRoles.includes(userRole))
    .map(([route]) => route);
}

/**
 * Get role display name for UI
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames = {
    admin: 'Administrator',
    accounts: 'Accounts',
    'data-operations': 'Data Operations',
    supervisor: 'Supervisor',
    hr: 'HR'
  };
  return roleNames[role];
}

/**
 * Get role description for UI
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions = {
    admin: 'Full system access with all administrative privileges',
    accounts: 'Access to financial data, payroll, reports, and accounting features',
    'data-operations': 'Access to employee data management, registrations, and updates',
    supervisor: 'Access to monitoring, reports, and employee data viewing',
    hr: 'Access to user management tasks like password resets for non-admins'
  };
  return descriptions[role];
} 

// ---- Dynamic permissions support ----
export type RolePermissionsConfig = {
  routePermissions: Record<string, UserRole[]>;
  menuPermissions: Record<string, UserRole[]>;
  featurePermissions: Record<string, UserRole[]>;
};

/**
 * Check route permission allowing optional dynamic overrides
 */
export function hasRoutePermissionWithConfig(
  userRole: UserRole,
  route: string,
  config?: Partial<RolePermissionsConfig>
): boolean {
  const source = config?.routePermissions || ROUTE_PERMISSIONS;
  const allowedRoles = source[route];
  return Array.isArray(allowedRoles) ? allowedRoles.includes(userRole) : false;
}

/**
 * Check menu permission allowing optional dynamic overrides
 */
export function hasMenuPermissionWithConfig(
  userRole: UserRole,
  menuKey: string,
  config?: Partial<RolePermissionsConfig>
): boolean {
  const source = config?.menuPermissions || MENU_PERMISSIONS;
  const allowedRoles = source[menuKey];
  return Array.isArray(allowedRoles) ? allowedRoles.includes(userRole) : false;
}

/**
 * Check feature permission allowing optional dynamic overrides
 */
export function hasFeaturePermissionWithConfig(
  userRole: UserRole,
  featureKey: string,
  config?: Partial<RolePermissionsConfig>
): boolean {
  const source = config?.featurePermissions || FEATURE_PERMISSIONS;
  const allowedRoles = source[featureKey];
  return Array.isArray(allowedRoles) ? allowedRoles.includes(userRole) : false;
}





















