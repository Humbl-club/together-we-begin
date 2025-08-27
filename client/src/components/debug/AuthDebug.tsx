import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Building2, User } from 'lucide-react';

export const AuthDebug: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, isOrganizationAdmin } = useAuth();

  if (!user) return null;

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-80 bg-black/90 text-white border-white/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Auth Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <span className="text-gray-400">Email:</span> 
          <span className="ml-2 font-mono">{user.email}</span>
        </div>
        
        <div>
          <span className="text-gray-400">User ID:</span> 
          <span className="ml-2 font-mono text-[10px]">{user.id}</span>
        </div>

        <div className="flex gap-2 pt-2 border-t border-white/10">
          {isSuperAdmin && (
            <Badge className="bg-purple-600 text-white">
              <Shield className="w-3 h-3 mr-1" />
              Super Admin
            </Badge>
          )}
          
          {isOrganizationAdmin && (
            <Badge className="bg-blue-600 text-white">
              <Building2 className="w-3 h-3 mr-1" />
              Org Admin
            </Badge>
          )}
          
          {isAdmin && (
            <Badge className="bg-green-600 text-white">
              <User className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
          
          {!isSuperAdmin && !isOrganizationAdmin && !isAdmin && (
            <Badge className="bg-gray-600 text-white">
              Regular User
            </Badge>
          )}
        </div>

        <div className="pt-2 border-t border-white/10 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">isSuperAdmin:</span>
            <span className={isSuperAdmin ? 'text-green-400' : 'text-red-400'}>
              {isSuperAdmin ? '✓ true' : '✗ false'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">isOrganizationAdmin:</span>
            <span className={isOrganizationAdmin ? 'text-green-400' : 'text-red-400'}>
              {isOrganizationAdmin ? '✓ true' : '✗ false'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">isAdmin:</span>
            <span className={isAdmin ? 'text-green-400' : 'text-red-400'}>
              {isAdmin ? '✓ true' : '✗ false'}
            </span>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="pt-2 border-t border-white/10">
            <a 
              href="/super-admin" 
              className="text-purple-400 hover:text-purple-300 underline text-xs"
            >
              → Go to Super Admin Dashboard
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};