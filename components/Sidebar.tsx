'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Clock,
  Upload,
  Building2,
  FileText,
  Receipt,
  LogOut,
  UserCog,
  UserPlus,
  Users,
  DollarSign,
  FileSpreadsheet,
  ChevronDown,
  ClipboardList,
  CheckCircle,
  Sun,
  Moon,
  Maximize2,
  Bell,
  Wallet,
  CreditCard,
  UserCheck,
  FileBarChart,
  ArrowLeftRight,
  TrendingUp,
  MoreHorizontal,
  HelpCircle,
  MessageSquare,
  Menu,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { globalLoadingState } from './Layout';
import PendingApprovalsBadge from './PendingApprovalsBadge';
import LordIcon, { LordIconRef } from '@/components/ui/LordIcon';
import { hasMenuPermission, hasMenuPermissionWithConfig, UserRole } from '@/lib/auth/permissions';
import { showSuccessToast, showErrorToast } from '@/lib/toast-config';
import activeEmployeesIcon from '../public/icons/active employees.json';
import pendingApprovalsIcon from '../public/icons/approvals.json';
import dashboardIcon from '../public/icons/dashboard.json';
import timeSheetIcon from '../public/icons/timesheet.json';
import bulkUploadsIcon from '../public/icons/dataprocess.json';
import registrationIcon from '../public/icons/registeration.json';
import updationIcon from '../public/icons/updation.json';
import unitRegistrationIcon from '../public/icons/unitreg.json';
import employeeRegistrationIcon from '../public/icons/employeereg.json';
import unitUpdationIcon from '../public/icons/unitupd.json';
import employeeUpdationIcon from '../public/icons/employeeupd.json';
import reportsIcon from '../public/icons/reports.json';
import salaryReportsIcon from '../public/icons/salaryreport.json';
import invoiceGeneratorIcon from '../public/icons/invoicegen.json';
import exportsIcon from '../public/icons/exports.json';
import esicExportIcon from '../public/icons/esic.json';
import epfExportIcon from '../public/icons/epf.json';
import lwfExportIcon from '../public/icons/lwf.json';
import pfEsiExportIcon from '../public/icons/pfesi.json';
import logoutIcon from '../public/icons/logout.json';
import searchIcon from '../public/icons/search.json';


interface SidebarProps {
  onNavigate?: (path: string) => void;
}

// Define menu item type for better type safety
interface MenuItem {
  name: string
  href: string;
  icon: React.ComponentType<any>;
  permission?: string;
  onClick?: () => void;
  children?: MenuItem[];
}

// Lordicon System Family Animated Icons
const LORDICON_MAPPING: Record<string, string | object> = {
  'Dashboard': dashboardIcon, // System - Home/Dashboard
  'Time Sheet': timeSheetIcon, // System - Clock/Time
  'Data and Processing': bulkUploadsIcon, // System - Upload/Cloud
  'Registration': registrationIcon, // System - Add/Create
  'Updation': updationIcon, // System - Edit/Update
  'Unit Registration': unitRegistrationIcon, // Unit registration submenu
  'Employee Registration': employeeRegistrationIcon, // Employee registration submenu
  'Unit Updation': unitUpdationIcon, // Unit updation submenu
  'Employee Updation': employeeUpdationIcon, // Employee updation submenu
  'Active Employees': activeEmployeesIcon, // Local system-regular-8-account-hover-pinch.json
  'Reports': reportsIcon, // Local reports.json
  'Salary Reports': salaryReportsIcon, // Salary reports submenu
  'Invoice Generator': invoiceGeneratorIcon, // Invoice generator submenu
  'Exports': exportsIcon, // Local exports.json
  'ESIC Export': esicExportIcon, // ESIC export submenu
  'EPF Export': epfExportIcon, // EPF export submenu
  'LWF Export': lwfExportIcon, // LWF export submenu
  'PF/ESI Export': pfEsiExportIcon, // PF/ESI export submenu
  'Pending Approvals': pendingApprovalsIcon, // System - Check/Approve
  'Logout': logoutIcon, // Local logout.json
  'General': 'https://cdn.lordicon.com/lyrrgrsl.json', // System - Settings/Gear
};

// Move menu structure outside component to prevent recreation on every render
const MENU_ITEMS = {
  home: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    { name: 'Time Sheet', href: '/attendance', icon: Clock, permission: 'attendance' },
    { name: 'Data and Processing', href: '/bulk-uploads', icon: Upload, permission: 'bulk-uploads' },
    {
      name: 'Registration',
      href: '#',
      icon: ClipboardList,
      permission: 'registration',
      children: [
        { name: 'Unit Registration', href: '/unit-registration', icon: Building2, permission: 'unit-registration' },
        { name: 'Employee Registration', href: '/employee-registration', icon: UserPlus, permission: 'employee-registration' },
      ]
    },
    {
      name: 'Updation',
      href: '#',
      icon: FileText,
      permission: 'updation',
      children: [
        { name: 'Unit Updation', href: '/unit-updation', icon: Building2, permission: 'unit-updation' },
        { name: 'Employee Updation', href: '/employee-updation', icon: UserCog, permission: 'employee-updation' },
      ]
    },
    { name: 'Active Employees', href: '/active-employees', icon: Users, permission: 'active-employees' },
  ],
  apps: [
    {
      name: 'Reports',
      href: '#',
      icon: Receipt,
      permission: 'reports',
      children: [
        { name: 'Salary Reports', href: '/salary-reports', icon: DollarSign, permission: 'salary-reports' },
        { name: 'Invoice Generator', href: '/invoice', icon: Receipt, permission: 'invoice' },
      ]
    },
    {
      name: 'Exports',
      href: '#',
      icon: FileSpreadsheet,
      permission: 'exports',
      children: [
        { name: 'ESIC Export', href: '/esic-export', icon: FileSpreadsheet, permission: 'esic-export' },
        { name: 'EPF Export', href: '/epf-export', icon: FileSpreadsheet, permission: 'epf-export' },
        { name: 'LWF Export', href: '/lwf-export', icon: FileSpreadsheet, permission: 'lwf-export' },
        { name: 'PF/ESI Export', href: '/pf-esi-export', icon: FileSpreadsheet, permission: 'pf-esi-export' },
      ]
    },
  ],
  settings: [
    { name: 'Pending Approvals', href: '/pending-approvals', icon: CheckCircle, permission: 'pending-approvals' },
    { name: 'Logout', href: '#', icon: LogOut, onClick: () => { } }, // onClick will be set dynamically
  ]
};

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['main-menu', 'general']); // Default sections open
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleConfig, setRoleConfig] = useState<{ menuPermissions?: Record<string, UserRole[]> } | null>(null);
  const [permissionsVersion, setPermissionsVersion] = useState(0);
  const [userInfo, setUserInfo] = useState<{ fullName?: string; tmsId?: string; userRole?: string } | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Refs for icon animations - using manual trigger controlled by button hover
  const iconRefs = useRef<{ [key: string]: React.RefObject<LordIconRef> }>({});

  // Get or create ref for an icon
  const getIconRef = (itemName: string) => {
    if (!iconRefs.current[itemName]) {
      iconRefs.current[itemName] = React.createRef<LordIconRef>();
    }
    return iconRefs.current[itemName];
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user role from session cookie
  useEffect(() => {
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionUser='));

      if (sessionCookie) {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));

        if (sessionData.userRole) {
          setUserRole(sessionData.userRole as UserRole);
        } else {
          // Emergency fallback - if logged in but no role, assume admin for TMS009
          if (sessionData.isLoggedIn && sessionData.tmsId === 'TMS009') {
            setUserRole('admin');
          } else {
            // Default fallback to admin if session exists but no role
            setUserRole('admin');
          }
        }

        // Set user info from session cookie
        let fullName = sessionData.fullName || '';

        // Also check localStorage and sessionStorage as fallback
        if (!fullName) {
          try {
            fullName = localStorage.getItem('fullName') || sessionStorage.getItem('fullName') || '';
          } catch { }
        }

        setUserInfo({
          fullName: fullName,
          tmsId: sessionData.tmsId || '',
          userRole: sessionData.userRole || 'admin'
        });
      } else {
        // If no session cookie, try to get from localStorage/sessionStorage
        setUserRole('admin');
        try {
          const storedName = localStorage.getItem('fullName') || sessionStorage.getItem('fullName') || '';
          const storedTmsId = localStorage.getItem('tmsId') || '';
          if (storedName || storedTmsId) {
            setUserInfo({
              fullName: storedName,
              tmsId: storedTmsId,
              userRole: 'admin'
            });
          } else {
            setUserInfo(null);
          }
        } catch {
          setUserInfo(null);
        }
      }
    } catch (error) {
      // If any error occurs, fallback to admin role
      setUserRole('admin');
      setUserInfo(null);
    }
  }, []);


  // Load dynamic role permissions (admin only endpoint; safe to request, server will check role)
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Add cache-busting parameter to ensure fresh data
        const res = await fetch(`/api/admin/permissions?_t=${Date.now()}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setRoleConfig({ menuPermissions: data.menuPermissions });
        }
      } catch (error) {
        // Silently handle permission loading errors
      }
    };
    if (userRole) {
      loadConfig();
    }
  }, [userRole, permissionsVersion]);

  // Listen for permissions update events
  useEffect(() => {
    const handlePermissionsUpdate = () => {
      setPermissionsVersion(prev => prev + 1);
    };

    // Listen for custom permissions update event
    window.addEventListener('permissionsUpdated', handlePermissionsUpdate);

    // Also listen for storage events (fallback for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'permissionsUpdated' && e.newValue) {
        handlePermissionsUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('permissionsUpdated', handlePermissionsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        try { localStorage.clear(); } catch { }
        try { sessionStorage.clear(); } catch { }
        // Also clear cookies client-side
        try {
          const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = `sessionUser=; path=/; SameSite=Lax; ${expired}`;
          document.cookie = `auth-token=; path=/; SameSite=Lax; ${expired}`;
        } catch { }
        showSuccessToast('Logged out successfully');
        window.location.href = '/login';
      } else {
        showErrorToast('Failed to logout');
      }
    } catch (error) {
      showErrorToast('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  const navigateTo = useCallback((href: string) => {
    // Always allow navigation/animation trigger, even for same page
    // Use router.push for client-side navigation (not async)
    router.push(href);

    // Close mobile sidebar when navigating
    setIsMobileSidebarOpen(false);

    if (onNavigate) onNavigate(href);
  }, [pathname, router, onNavigate]);

  // Filter menu items based on user permissions
  const filteredMenuItems = useMemo(() => {

    if (!userRole) {
      // Fallback: show basic menu items when userRole is not available
      return {
        home: [
          { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { name: 'Attendance', href: '/attendance', icon: Clock }
        ],
        apps: [],
        settings: [
          { name: 'Logout', href: '#', icon: LogOut, onClick: handleLogout }
        ]
      };
    }

    const filterItems = (items: MenuItem[]): MenuItem[] => {
      return items.filter(item => {
        // Check if user has permission for this item
        const hasPermission = !item.permission
          || (roleConfig?.menuPermissions
            ? hasMenuPermissionWithConfig(userRole, item.permission, { menuPermissions: roleConfig.menuPermissions })
            : hasMenuPermission(userRole, item.permission));

        if (!hasPermission) return false;

        // If item has children, filter them too
        if (item.children) {
          const filteredChildren = filterItems(item.children);
          // Only show parent if it has visible children
          if (filteredChildren.length === 0) return false;
          return { ...item, children: filteredChildren };
        }

        return true;
      }).map(item => {
        // Process children if they exist
        if (item.children) {
          return { ...item, children: filterItems(item.children) };
        }
        return item;
      });
    };

    const filtered = {
      home: filterItems(MENU_ITEMS.home),
      apps: filterItems(MENU_ITEMS.apps),
      settings: filterItems(MENU_ITEMS.settings).map(item => {
        // Set the logout handler dynamically
        if (item.name === 'Logout') {
          return { ...item, onClick: handleLogout };
        }
        return item;
      })
    };



    return filtered;
  }, [userRole, handleLogout, roleConfig]);

  // Get user initials from full name
  const getUserInitials = useCallback((fullName?: string): string => {
    if (!fullName) return 'U';

    const nameParts = fullName.trim().split(' ').filter(part => part.length > 0);

    if (nameParts.length === 0) return 'U';
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

    // Get first letter of first name and first letter of last name
    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();

    return firstInitial + lastInitial;
  }, []);

  // Safer icon rendering function with animation support
  const renderIcon = useCallback((IconComponent: any, props: any = {}, itemName?: string, iconRef?: React.RefObject<LordIconRef>) => {
    // Check if we have a Lordicon mapping for this item
    if (itemName && LORDICON_MAPPING[itemName]) {
      const iconSource = LORDICON_MAPPING[itemName];
      if (typeof iconSource === 'string') {
        // URL source
        return (
          <LordIcon
            ref={iconRef}
            src={iconSource}
            trigger="manual"
            size={props.size || 20} // Standard size for sidebar icons
            className={props.className}
          />
        );
      } else {
        // Direct JSON object - use manual trigger controlled by parent button
        return (
          <LordIcon
            ref={iconRef}
            icon={iconSource}
            trigger="manual"
            size={props.size || 20} // Standard size for sidebar icons
            className={props.className}
          />
        );
      }
    }

    if (!IconComponent) return null;

    // Fallback to standard icon rendering
    try {
      return React.createElement(IconComponent as any, props);
    } catch {
      if (typeof IconComponent === 'object' && IconComponent?.default) {
        return React.createElement(IconComponent.default as any, props);
      }
      return null;
    }
  }, []);

  // Toggle submenu expansion
  const toggleSubmenu = useCallback((menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName) ? prev.filter(name => name !== menuName) : [...prev, menuName]
    );
  }, []);

  // Enhanced click outside handling for submenus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Only close submenu items, keep main sections (main-menu and general) open
      if (target && !target.closest('aside')) {
        setExpandedMenus(prev => prev.filter(name => name === 'main-menu' || name === 'general'));
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Only close submenu items, keep main sections open
        setExpandedMenus(prev => prev.filter(name => name === 'main-menu' || name === 'general'));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);


  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Vertical Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#f6f7f9] dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col py-6 z-40 transform transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
        style={{
          width: '280px',
          transition: 'background-color 220ms cubic-bezier(0.4, 0, 0.2, 1), border-color 220ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Logo/Brand */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-white">
              <path d="M35 0L35 70M0 35L70 35M11.8 11.8L58.2 58.2M11.8 58.2L58.2 11.8" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">Payroll</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-4">
          {/* Main Menu Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSubmenu('main-menu')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-slate-600 dark:hover:text-slate-400"
            >
              Main Menu
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.includes('main-menu') ? 'rotate-180' : ''}`} />
            </button>

            {expandedMenus.includes('main-menu') && (
              <div className="mt-2 space-y-1">
                {filteredMenuItems.home.map((item: MenuItem) => {
                  const isActive = pathname === item.href;
                  const hasChildren = item.children && item.children.length > 0;
                  const anyChildActive = hasChildren && item.children.some((child: any) => pathname === child.href);

                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => {
                          if (hasChildren) {
                            toggleSubmenu(item.name);
                          } else if (item.onClick) {
                            item.onClick();
                          } else {
                            navigateTo(item.href);
                          }
                        }}
                        onMouseEnter={() => getIconRef(item.name).current?.playAnimation()}
                        onMouseLeave={() => getIconRef(item.name).current?.goToFirstFrame()}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm relative ${isActive || anyChildActive
                          ? 'text-gray-900 dark:text-white font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        {(isActive || anyChildActive) && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-900 dark:bg-white rounded-r" />
                        )}
                        {renderIcon(item.icon, { className: 'w-5 h-5 flex-shrink-0', trigger: 'hover', size: 20 }, item.name, getIconRef(item.name))}
                        <span className="flex-1 text-left">{item.name}</span>
                        {hasChildren && (
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.includes(item.name) ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {/* Submenu */}
                      {hasChildren && expandedMenus.includes(item.name) && (
                        <div className="mt-1 ml-8 space-y-1">
                          {item.children!.map((child: MenuItem) => (
                            <button
                              key={child.name}
                              onClick={() => navigateTo(child.href)}
                              onMouseEnter={() => getIconRef(child.name).current?.playAnimation()}
                              onMouseLeave={() => getIconRef(child.name).current?.goToFirstFrame()}
                              className={`w-full text-left px-4 py-2 rounded-lg text-sm flex items-center gap-3 ${pathname === child.href
                                ? 'text-gray-900 dark:text-white font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                              {renderIcon(child.icon, { className: 'w-4 h-4', trigger: 'hover', size: 16 }, child.name, getIconRef(child.name))}
                              <span>{child.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Apps Section Items */}
                {filteredMenuItems.apps.map((item: MenuItem) => {
                  const isActive = pathname === item.href;
                  const hasChildren = item.children && item.children.length > 0;
                  const anyChildActive = hasChildren && item.children.some((child: any) => pathname === child.href);

                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => {
                          if (hasChildren) {
                            toggleSubmenu(item.name);
                          } else if (item.onClick) {
                            item.onClick();
                          } else {
                            navigateTo(item.href);
                          }
                        }}
                        onMouseEnter={() => getIconRef(item.name).current?.playAnimation()}
                        onMouseLeave={() => getIconRef(item.name).current?.goToFirstFrame()}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm relative ${isActive || anyChildActive
                          ? 'text-gray-900 dark:text-white font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        {(isActive || anyChildActive) && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-900 dark:bg-white rounded-r" />
                        )}
                        {renderIcon(item.icon, { className: 'w-5 h-5 flex-shrink-0', trigger: 'hover', size: 20 }, item.name, getIconRef(item.name))}
                        <span className="flex-1 text-left">{item.name}</span>
                        {hasChildren && (
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.includes(item.name) ? 'rotate-180' : ''}`} />
                        )}
                      </button>

                      {hasChildren && expandedMenus.includes(item.name) && (
                        <div className="mt-1 ml-8 space-y-1">
                          {item.children!.map((child: MenuItem) => (
                            <button
                              key={child.name}
                              onClick={() => navigateTo(child.href)}
                              onMouseEnter={() => getIconRef(child.name).current?.playAnimation()}
                              onMouseLeave={() => getIconRef(child.name).current?.goToFirstFrame()}
                              className={`w-full text-left px-4 py-2 rounded-lg text-sm flex items-center gap-3 ${pathname === child.href
                                ? 'text-gray-900 dark:text-white font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                              {renderIcon(child.icon, { className: 'w-4 h-4', trigger: 'hover', size: 16 }, child.name, getIconRef(child.name))}
                              <span>{child.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
            }
          </div>

          {/* General Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSubmenu('general')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-slate-600 dark:hover:text-slate-400"
            >
              General
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.includes('general') ? 'rotate-180' : ''}`} />
            </button>

            {expandedMenus.includes('general') && (
              <div className="mt-2 space-y-1">
                {filteredMenuItems.settings.map((item: MenuItem) => {
                  const isActive = pathname === item.href;

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else {
                          navigateTo(item.href);
                        }
                      }}
                      onMouseEnter={() => getIconRef(item.name).current?.playAnimation()}
                      onMouseLeave={() => getIconRef(item.name).current?.goToFirstFrame()}
                      disabled={isLoggingOut && item.name === 'Logout'}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm relative ${isActive
                        ? 'text-gray-900 dark:text-white font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-900 dark:bg-white rounded-r" />
                      )}
                      {renderIcon(item.icon, { className: 'w-5 h-5 flex-shrink-0', trigger: 'hover', size: 20 }, item.name, getIconRef(item.name))}
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Profile Section */}
        <div className="mt-auto px-4 pb-4 pt-3">
          <button
            onClick={() => navigateTo('/account-settings')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 group"
          >
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm flex-shrink-0">
              {getUserInitials(userInfo?.fullName)}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight mb-0.5">
                {userInfo?.fullName || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">
                {userInfo?.tmsId || 'TMS009'}
              </p>
            </div>

            {/* More Options Icon */}
            <MoreHorizontal className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </aside>
    </>
  );
}
