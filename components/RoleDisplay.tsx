'use client';

import { useEffect, useState } from 'react';
import { UserRole, getRoleDisplayName, getRoleDescription } from '@/lib/auth/permissions';
import { Shield, User, Users, Settings, Eye } from 'lucide-react';

interface RoleDisplayProps {
  className?: string;
  showDescription?: boolean;
}

export default function RoleDisplay({ className = '', showDescription = false }: RoleDisplayProps) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionUser='));
      
      if (sessionCookie) {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        if (sessionData.userRole) {
          setUserRole(sessionData.userRole as UserRole);
        }
        if (sessionData.tmsId) {
          setUserName(sessionData.tmsId);
        }
      }
    } catch (error) {
    }
  }, []);

  if (!userRole) {
    return null;
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-700" />;
      case 'accounts':
        return <Settings className="w-4 h-4 text-green-700" />;
      case 'data-operations':
        return <User className="w-4 h-4 text-blue-700" />;
      case 'supervisor':
        return <Eye className="w-4 h-4 text-purple-700" />;
      case 'hr':
        return <Users className="w-4 h-4 text-pink-700" />;
      default:
        return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-200 text-red-900 border-red-300';
      case 'accounts':
        return 'bg-green-200 text-green-900 border-green-300';
      case 'data-operations':
        return 'bg-blue-200 text-blue-900 border-blue-300';
      case 'supervisor':
        return 'bg-purple-200 text-purple-900 border-purple-300';
      case 'hr':
        return 'bg-pink-200 text-pink-900 border-pink-300';
      default:
        return 'bg-slate-100 text-slate-900 border-gray-200';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${getRoleColor(userRole)}`}>
        {getRoleIcon(userRole)}
        <span>{getRoleDisplayName(userRole)}</span>
      </div>
      
      {showDescription && (
        <div className="text-xs text-slate-600 max-w-md">
          {getRoleDescription(userRole)}
        </div>
      )}
      
      {userName && (
        <span className="text-xs text-slate-600">
          ({userName})
        </span>
      )}
    </div>
  );
}





















