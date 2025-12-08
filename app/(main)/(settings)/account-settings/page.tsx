'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Lock, Mail, Phone, Settings, Eye, EyeOff, UserCircle, Shield, Edit, Save, X, Users, ShieldCheck, Edit3, Grid3x3, Filter, Download, Plus } from 'lucide-react';
import LordIcon, { LordIconRef } from '../../../../components/ui/LordIcon';
import searchIcon from '../../../../public/icons/search.json';
import { toast } from 'react-hot-toast';
import type { UserRole } from '@/lib/auth/permissions';
import { MENU_PERMISSIONS, ROUTE_PERMISSIONS } from '@/lib/auth/permissions';
import AnimatedSelect, { DropdownProvider } from '@/components/AnimatedSelect';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    id: '',
    fullName: '',
    email: '',
    phone: '',
    role: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHR, setIsHR] = useState(false);
  const [canEditAccountSettings, setCanEditAccountSettings] = useState(false);
  const [manageUsers, setManageUsers] = useState<{ id: string; fullName?: string; role: UserRole }[]>([]);
  const [isSavingRole, setIsSavingRole] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ id: '', name: '', password: '', role: 'supervisor' as UserRole });
  const [isCreating, setIsCreating] = useState(false);
  const [roleAccess, setRoleAccess] = useState<{ routePermissions: Record<string, UserRole[]>; menuPermissions: Record<string, UserRole[]>; featurePermissions?: Record<string, UserRole[]> } | null>(null);
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchIconRef = useRef<LordIconRef>(null);

  // Map menu permission keys to the route paths they control
  const MENU_TO_ROUTES: Record<string, string[]> = {
    dashboard: ['/dashboard'],
    attendance: ['/attendance'],
    'bulk-uploads': ['/bulk-uploads'],
    registration: ['/unit-registration', '/employee-registration'],
    'unit-registration': ['/unit-registration'],
    'employee-registration': ['/employee-registration'],
    updation: ['/unit-updation', '/employee-updation'],
    'unit-updation': ['/unit-updation'],
    'employee-updation': ['/employee-updation'],
    'active-employees': ['/active-employees'],
    reports: ['/salary-reports', '/invoice'],
    'salary-reports': ['/salary-reports'],
    invoice: ['/invoice'],
    exports: ['/esic-export', '/epf-export', '/lwf-export', '/pf-esi-export'],
    'esic-export': ['/esic-export'],
    'epf-export': ['/epf-export'],
    'lwf-export': ['/lwf-export'],
    'pf-esi-export': ['/pf-esi-export'],
    'account-settings': ['/account-settings'],
    'pending-approvals': ['/pending-approvals']
  };

  const ALL_ROUTE_PATHS: string[] = Array.from(
    new Set(Object.values(MENU_TO_ROUTES).flat())
  );

  function computeRoutePermissionsFromMenus(menuPermissions: Record<string, UserRole[]>): Record<string, UserRole[]> {
    const routePerms: Record<string, UserRole[]> = {};
    for (const route of ALL_ROUTE_PATHS) {
      const controllingMenus = Object.entries(MENU_TO_ROUTES)
        .filter(([_, routes]) => routes.includes(route))
        .map(([menuKey]) => menuKey);
      const rolesForRoute = new Set<UserRole>();
      for (const menuKey of controllingMenus) {
        const roles = menuPermissions[menuKey] || [];
        roles.forEach(r => rolesForRoute.add(r));
      }
      routePerms[route] = Array.from(rolesForRoute);
    }
    return routePerms;
  }

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const id = localStorage.getItem('id');
        if (!id) {
          toast.error('No user found. Please login again.');
          return;
        }

        const response = await fetch(`/api/user?id=${id}`);
        const data = await response.json();

        if (response.ok) {
          const user = data.user || data;
          setFormData(prev => ({
            ...prev,
            _id: user._id || '',
            id: user.id || '',
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || '',
          }));

          const isAdminUser = user.role === 'admin';
          const isHRUser = user.role === 'hr';
          setIsAdmin(isAdminUser);
          setIsHR(isHRUser);

          if (isAdminUser || isHRUser) {
            try {
              const pres = await fetch('/api/admin/permissions', { credentials: 'include' });
              if (pres.ok) {
                const pdata = await pres.json();
                const menuPerms = pdata.menuPermissions || MENU_PERMISSIONS;
                const routePerms = pdata.routePermissions || computeRoutePermissionsFromMenus(menuPerms);
                const featurePerms = pdata.featurePermissions || { 'attendance-visibility': ['admin', 'hr'], 'account-settings-edit': ['admin'] };

                setRoleAccess({
                  routePermissions: routePerms,
                  menuPermissions: menuPerms,
                  featurePermissions: featurePerms
                });

                const editPermissionRoles = featurePerms['account-settings-edit'] || ['admin'];
                setCanEditAccountSettings(editPermissionRoles.includes(user.role));
              } else {
                const menuPerms = MENU_PERMISSIONS;
                const routePerms = computeRoutePermissionsFromMenus(menuPerms);
                setRoleAccess({ routePermissions: routePerms, menuPermissions: menuPerms, featurePermissions: { 'attendance-visibility': ['admin', 'hr'], 'account-settings-edit': ['admin'] } });
                setCanEditAccountSettings(isAdminUser);
              }
            } catch {
              const menuPerms = MENU_PERMISSIONS;
              const routePerms = computeRoutePermissionsFromMenus(menuPerms);
              setRoleAccess({ routePermissions: routePerms, menuPermissions: menuPerms, featurePermissions: { 'attendance-visibility': ['admin', 'hr'], 'account-settings-edit': ['admin'] } });
              setCanEditAccountSettings(isAdminUser);
            }
          } else {
            setCanEditAccountSettings(false);
          }
        } else {
          toast.error(data.error || 'Failed to fetch user data');
        }
      } catch (error) {
        toast.error('Error loading user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Profile updated successfully');
        if (data.user) {
          setFormData(prev => ({
            ...prev,
            ...data.user
          }));
        }
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const fetchManageableUsers = async () => {
    if (!(isAdmin || isHR)) return;
    if (usersLoaded || usersLoading) return;
    try {
      setUsersLoading(true);
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const list = await res.json();
      if (res.ok) {
        setManageUsers(list.users || []);
        setUsersLoaded(true);
      }
    } catch {
      // ignore
    } finally {
      setUsersLoading(false);
    }
  };

  const handleNewUserIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser(v => ({ ...v, id: e.target.value.toUpperCase() }));
  }, []);

  const handleNewUserNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser(v => ({ ...v, name: e.target.value }));
  }, []);

  const handleNewUserPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser(v => ({ ...v, password: e.target.value }));
  }, []);

  const handleNewUserRoleChange = useCallback((value: string) => {
    setNewUser(v => ({ ...v, role: value as UserRole }));
  }, []);



  const tabs = [
    { id: 'profile', label: 'Profile' },
    ...((isAdmin || isHR) ? [{ id: 'passwords', label: 'Password Management' }] : []),
    ...((isAdmin || isHR) ? [{ id: 'manage', label: 'Manage Accounts' }, { id: 'permissions', label: 'Role Access' }] : [])
  ];

  const filteredUsers = manageUsers.filter(u =>
    u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DropdownProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Account Settings Title - Left Side */}
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-slate-900 dark:text-white" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
            </div>

            {/* Search Box - Right Side */}
            <div
              className="relative w-64"
              onMouseEnter={() => searchIconRef.current?.playAnimation()}
              onMouseLeave={() => searchIconRef.current?.goToFirstFrame()}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LordIcon
                  ref={searchIconRef}
                  icon={searchIcon}
                  size={16}
                  className="text-gray-400"
                  trigger="manual"
                />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); if (tab.id === 'passwords' || tab.id === 'manage') fetchManageableUsers(); }}
                    className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? 'text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gray-900 dark:bg-white rounded-md"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">Profile Details</h3>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${isEditing
                          ? 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : 'border-gray-200 dark:border-gray-600 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600'
                          }`}
                      >
                        {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                        <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                      </button>
                    </div>

                    <div className="p-6">
                      {loading ? (
                        <LoadingSpinner fullScreen={false} />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</label>
                            <div className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium">
                              {formData.id}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</label>
                            <div className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium capitalize">
                              {formData.role}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                            {isEditing ? (
                              <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            ) : (
                              <div className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium">
                                {formData.fullName || '-'}
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</label>
                            {isEditing ? (
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            ) : (
                              <div className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium">
                                {formData.email || '-'}
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</label>
                            {isEditing ? (
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            ) : (
                              <div className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium">
                                {formData.phone || '-'}
                              </div>
                            )}
                          </div>

                          {isEditing && (
                            <div className="md:col-span-2 flex justify-end pt-4">
                              <button
                                onClick={handleProfileUpdate}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                              >
                                <Save className="w-4 h-4" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Password Management (Admin + HR) */}
                {(isAdmin || isHR) && activeTab === 'passwords' && (
                  <PasswordManagementSection
                    users={manageUsers}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searchIconRef={searchIconRef}
                    usersLoading={usersLoading}
                    canEditAccountSettings={canEditAccountSettings}
                    isAdmin={isAdmin}
                  />
                )}

                {/* Manage Accounts (Admin + HR) */}
                {(isAdmin || isHR) && activeTab === 'manage' && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                          Manage Accounts
                        </h3>
                        {canEditAccountSettings && (isAdmin || isHR) && (
                          <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create New User</span>
                          </button>
                        )}
                      </div>
                      <div
                        className="relative"
                        onMouseEnter={() => searchIconRef.current?.playAnimation()}
                        onMouseLeave={() => searchIconRef.current?.goToFirstFrame()}
                      >
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <LordIcon
                            ref={searchIconRef}
                            icon={searchIcon}
                            size={14}
                            className="text-slate-400"
                            trigger="manual"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-slate-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Full Name</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {usersLoading && (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-600 dark:text-slate-400">
                                Loading users...
                              </td>
                            </tr>
                          )}
                          {!usersLoading && filteredUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-900 dark:text-white">{u.id}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">{u.fullName || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap w-[200px]">
                                <AnimatedSelect
                                  id={`user-role-${u.id}`}
                                  value={u.role}
                                  onChange={(value) => setManageUsers(prev => prev.map(m => m.id === u.id ? { ...m, role: value as UserRole } : m))}
                                  options={((isAdmin ? ['admin', 'accounts', 'data-operations', 'supervisor', 'hr'] : ['accounts', 'data-operations', 'supervisor', 'hr']) as UserRole[]).map(r => ({
                                    value: r,
                                    label: r
                                  }))}
                                  placeholder="Select Role"
                                  disabled={!canEditAccountSettings || (!isAdmin && !isHR)}
                                  className="text-xs"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <button
                                  onClick={async () => {
                                    try {
                                      setIsSavingRole(u.id);
                                      const res = await fetch('/api/admin/users/update-role', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({ id: u.id, role: u.role })
                                      });
                                      if (res.ok) {
                                        toast.success('Role updated');
                                      } else {
                                        toast.error('Failed to update');
                                      }
                                    } catch (e) {
                                      toast.error('Failed to update');
                                    } finally {
                                      setIsSavingRole(null);
                                    }
                                  }}
                                  disabled={isSavingRole === u.id || !canEditAccountSettings || (!isAdmin && !isHR)}
                                  className="px-3 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                  {isSavingRole === u.id ? 'Saving...' : 'Save'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Role Access (Admin + HR) */}
                {(isAdmin || isHR) && activeTab === 'permissions' && (
                  <div className="space-y-6">
                    {/* App Menus */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">App Menus Access</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Menu</th>
                              {(['admin', 'accounts', 'data-operations', 'supervisor', 'hr'] as UserRole[]).map(r => (
                                <th key={r} className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                  {r}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {roleAccess && Object.keys(roleAccess.menuPermissions).map((key) => (
                              <tr key={key} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-900 dark:text-white capitalize">
                                  {key.replace(/-/g, ' ')}
                                </td>
                                {(['admin', 'accounts', 'data-operations', 'supervisor', 'hr'] as UserRole[]).map(r => {
                                  const checked = roleAccess.menuPermissions[key]?.includes(r) || false;
                                  return (
                                    <td key={r} className="px-4 py-3 text-left">
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          disabled={!canEditAccountSettings || !isAdmin}
                                          onChange={(e) => {
                                            setRoleAccess(prev => {
                                              if (!prev) return prev;
                                              const roles = new Set(prev.menuPermissions[key] || []);
                                              if (e.target.checked) roles.add(r); else roles.delete(r);
                                              const newMenu = { ...prev.menuPermissions, [key]: Array.from(roles) as UserRole[] };
                                              const newRoutes = computeRoutePermissionsFromMenus(newMenu);
                                              return { ...prev, menuPermissions: newMenu, routePermissions: newRoutes };
                                            });
                                          }}
                                          className="sr-only peer"
                                        />
                                        <div className={`w-11 h-6 bg-gray-300 border border-gray-400 dark:border-gray-600 shrink-0 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300 dark:peer-focus:ring-slate-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-blue-600 ${(!canEditAccountSettings || !isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                                      </label>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Feature Permissions */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Feature Permissions</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Feature</th>
                              {(['admin', 'accounts', 'data-operations', 'supervisor', 'hr'] as UserRole[]).map(r => (
                                <th key={r} className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                  {r}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-xs font-medium text-slate-900 dark:text-white">Attendance Visibility</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">View all employee attendance</div>
                              </td>
                              {(['admin', 'accounts', 'data-operations', 'supervisor', 'hr'] as UserRole[]).map(r => {
                                const checked = roleAccess?.featurePermissions?.['attendance-visibility']?.includes(r) || false;
                                return (
                                  <td key={r} className="px-4 py-3 text-left">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={!canEditAccountSettings || !isAdmin}
                                        onChange={(e) => {
                                          setRoleAccess(prev => {
                                            if (!prev) return prev;
                                            const roles = new Set(prev.featurePermissions?.['attendance-visibility'] || []);
                                            if (e.target.checked) roles.add(r); else roles.delete(r);
                                            return {
                                              ...prev,
                                              featurePermissions: {
                                                ...prev.featurePermissions,
                                                'attendance-visibility': Array.from(roles) as UserRole[]
                                              }
                                            };
                                          });
                                        }}
                                        className="sr-only peer"
                                      />
                                      <div className={`w-11 h-6 bg-gray-300 border border-gray-400 dark:border-gray-600 shrink-0 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300 dark:peer-focus:ring-slate-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-blue-600 ${(!canEditAccountSettings || !isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                                    </label>
                                  </td>
                                );
                              })}
                            </tr>
                            <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-xs font-medium text-slate-900 dark:text-white">Account Settings Edit</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">Edit settings (except Profile)</div>
                              </td>
                              {(['admin', 'accounts', 'data-operations', 'supervisor', 'hr'] as UserRole[]).map(r => {
                                const checked = roleAccess?.featurePermissions?.['account-settings-edit']?.includes(r) || false;
                                return (
                                  <td key={r} className="px-4 py-3 text-left">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={!canEditAccountSettings || !isAdmin}
                                        onChange={(e) => {
                                          setRoleAccess(prev => {
                                            if (!prev) return prev;
                                            const roles = new Set(prev.featurePermissions?.['account-settings-edit'] || []);
                                            if (e.target.checked) roles.add(r); else roles.delete(r);
                                            return {
                                              ...prev,
                                              featurePermissions: {
                                                ...prev.featurePermissions,
                                                'account-settings-edit': Array.from(roles) as UserRole[]
                                              }
                                            };
                                          });
                                        }}
                                        className="sr-only peer"
                                      />
                                      <div className={`w-11 h-6 bg-gray-300 border border-gray-400 dark:border-gray-600 shrink-0 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-300 dark:peer-focus:ring-slate-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-blue-600 ${(!canEditAccountSettings || !isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                                    </label>
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={async () => {
                          if (!roleAccess) return;
                          try {
                            setIsSavingAccess(true);
                            const menuPermissions = roleAccess.menuPermissions;
                            const routePermissions = computeRoutePermissionsFromMenus(menuPermissions);
                            const featurePermissions = roleAccess.featurePermissions || {};
                            const res = await fetch('/api/admin/permissions', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ menuPermissions, routePermissions, featurePermissions })
                            });
                            if (res.ok) {
                              toast.success('Access rules saved');
                              window.dispatchEvent(new CustomEvent('permissionsUpdated'));
                            } else {
                              toast.error('Failed to save');
                            }
                          } catch (e) {
                            toast.error('Failed to save');
                          } finally {
                            setIsSavingAccess(false);
                          }
                        }}
                        disabled={isSavingAccess || !canEditAccountSettings || !isAdmin}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isSavingAccess ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white dark:border-slate-900 border-t-transparent"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Create User Dialog */}
                <AnimatePresence>
                  {(isAdmin || isHR) && isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setIsCreateOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Create New User</h3>
                          <button onClick={() => setIsCreateOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-6 space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID <span className="text-red-500">*</span></label>
                            <input
                              value={newUser.id}
                              onChange={handleNewUserIdChange}
                              placeholder="e.g. TMS010"
                              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                            <input
                              value={newUser.name}
                              onChange={handleNewUserNameChange}
                              placeholder="Optional"
                              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password <span className="text-red-500">*</span></label>
                            <input
                              type="password"
                              value={newUser.password}
                              onChange={handleNewUserPasswordChange}
                              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</label>
                            <AnimatedSelect
                              id="new-user-role"
                              value={newUser.role}
                              onChange={handleNewUserRoleChange}
                              options={((isAdmin ? ['admin', 'accounts', 'data-operations', 'supervisor', 'hr'] : ['accounts', 'data-operations', 'supervisor', 'hr']) as UserRole[]).map(r => ({
                                value: r,
                                label: r
                              }))}
                              placeholder="Select Role"
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                          <button
                            onClick={() => setIsCreateOpen(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              if (!newUser.id.trim() || !newUser.password.trim()) {
                                toast.error('ID and Password are required');
                                return;
                              }
                              try {
                                setIsCreating(true);
                                const res = await fetch('/api/auth/register', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({
                                    id: newUser.id,
                                    password: newUser.password,
                                    name: newUser.name || undefined,
                                    role: newUser.role,
                                  })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  toast.success('User created');
                                  setManageUsers(prev => [{ id: data.user.id, fullName: data.user.fullName, role: data.user.role }, ...prev]);
                                  setIsCreateOpen(false);
                                  setNewUser({ id: '', name: '', password: '', role: 'supervisor' });
                                } else {
                                  toast.error(data.error || 'Failed to create user');
                                }
                              } catch (e) {
                                toast.error('Failed to create user');
                              } finally {
                                setIsCreating(false);
                              }
                            }}
                            disabled={isCreating}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 disabled:opacity-60 transition-opacity"
                          >
                            {isCreating ? 'Creating...' : 'Create User'}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </DropdownProvider>
  );
}

// Sub-component for Password Management to isolate state and prevent focus loss
interface PasswordManagementSectionProps {
  users: { id: string; fullName?: string; role: UserRole }[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchIconRef: React.RefObject<LordIconRef>;
  usersLoading: boolean;
  canEditAccountSettings: boolean;
  isAdmin: boolean;
}

const PasswordManagementSection: React.FC<PasswordManagementSectionProps> = ({
  users,
  searchQuery,
  setSearchQuery,
  searchIconRef,
  usersLoading,
  canEditAccountSettings,
  isAdmin
}) => {
  const [resettingUser, setResettingUser] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState<string>('');

  const handleResetPasswordChange = (id: string, value: string) => {
    setResettingUser(id);
    setResetPasswordValue(value);
  };

  const filteredUsers = users.filter(u =>
    u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Password Management
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
              <LordIcon
                ref={searchIconRef}
                icon={searchIcon}
                size={14}
                className="text-slate-400"
                trigger="hover"
              />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-slate-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">ID</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Full Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Role</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">New Password</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {usersLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-600 dark:text-slate-400">
                  Loading users...
                </td>
              </tr>
            )}
            {!usersLoading && filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-900 dark:text-white">{u.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">{u.fullName || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 capitalize">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <input
                    type="password"
                    value={resettingUser === u.id ? resetPasswordValue : ''}
                    onChange={e => handleResetPasswordChange(u.id, e.target.value)}
                    placeholder={!canEditAccountSettings ? 'No permission' : 'New password'}
                    disabled={!canEditAccountSettings || (!isAdmin && u.role === 'admin')}
                    className="w-full max-w-[180px] px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <button
                    onClick={async () => {
                      if (!resetPasswordValue || resettingUser !== u.id) {
                        toast.error('Enter a new password');
                        return;
                      }
                      try {
                        const res = await fetch('/api/admin/users/reset-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ id: u.id, newPassword: resetPasswordValue })
                        });
                        if (res.ok) {
                          toast.success('Password reset');
                          setResetPasswordValue('');
                          setResettingUser(null);
                        } else {
                          toast.error('Failed to reset');
                        }
                      } catch (e) {
                        toast.error('Failed to reset');
                      }
                    }}
                    disabled={!canEditAccountSettings || (!isAdmin && u.role === 'admin')}
                    className="px-3 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
