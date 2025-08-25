import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Shield, ShieldOff, Crown, Users, UserX, UserCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';

interface UserWithRoles {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  created_at: string;
  roles: string[];
  is_active?: boolean;
  last_login?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_users_with_roles', {
        _requesting_user_id: user?.id
      });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const { data, error } = await supabase.rpc('assign_user_role', {
        _user_id: userId,
        _role: role as 'admin' | 'member',
        _assigned_by: user?.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Role assigned successfully',
        });
        loadUsers();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { data, error } = await supabase.rpc('remove_user_role', {
        _user_id: userId,
        _role: role as 'admin' | 'member',
        _removed_by: user?.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Role removed successfully',
        });
        loadUsers();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove role',
        variant: 'destructive',
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // For now, we'll update a field in profiles table to track active status
      // In a real implementation, you might disable auth access
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_text: currentStatus ? 'user_suspended' : 'user_activated',
        target_type_text: 'user',
        target_id_param: userId,
        details_param: { new_status: !currentStatus }
      });

      toast({
        title: 'Success',
        description: `User ${!currentStatus ? 'activated' : 'suspended'} successfully`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Badge variant="secondary">{users.length} Users</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="user-search"
            name="userSearch"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoComplete="off"
          />
      </div>

      {/* Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.full_name || user.username || 'Unknown User'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => selectedUser && selectedRole && assignRole(selectedUser, selectedRole)}
              disabled={!selectedUser || !selectedRole}
            >
              Assign Role
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((userData) => (
          <Card key={userData.user_id} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={userData.avatar_url} />
                    <AvatarFallback>
                      {userData.full_name?.charAt(0) || userData.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-semibold">
                      {userData.full_name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {userData.username && `@${userData.username}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {userData.roles && userData.roles.length > 0 ? (
                      userData.roles.map((role) => (
                        <div key={role} className="flex items-center gap-1">
                          <Badge variant={getRoleColor(role)} className="flex items-center gap-1">
                            {getRoleIcon(role)}
                            {role}
                          </Badge>
                          
                          {role !== 'member' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <ShieldOff className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Role</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove the {role} role from {userData.full_name}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => removeRole(userData.user_id, role)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove Role
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      ))
                    ) : (
                      <Badge variant="outline">No roles</Badge>
                    )}
                  </div>

                  {/* User Status Badge */}
                  <Badge variant={userData.is_active !== false ? "default" : "destructive"}>
                    {userData.is_active !== false ? "Active" : "Suspended"}
                  </Badge>

                  {/* User Actions */}
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={userData.is_active !== false ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                        >
                          {userData.is_active !== false ? (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {userData.is_active !== false ? 'Suspend User' : 'Activate User'}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to {userData.is_active !== false ? 'suspend' : 'activate'} {userData.full_name}?
                            {userData.is_active !== false && ' This will prevent them from accessing the platform.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => toggleUserStatus(userData.user_id, userData.is_active !== false)}
                            className={userData.is_active !== false ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                          >
                            {userData.is_active !== false ? 'Suspend User' : 'Activate User'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <EmptyState
          icon={<Users className="w-full h-full" />}
          title="No users found"
          description={searchTerm ? 'Try adjusting your search terms.' : 'No users are registered yet.'}
          action={searchTerm ? {
            label: "Clear Search",
            onClick: () => setSearchTerm(''),
            variant: "outline"
          } : undefined}
        />
      )}
    </div>
  );
};

export default UserManagement;