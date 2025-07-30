import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Calendar, 
  Copy, 
  Eye, 
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Invite {
  id: string;
  code: string;
  invite_type: string;
  max_uses: number;
  current_uses: number;
  status: 'pending' | 'used' | 'expired';
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  created_by: string;
}

const InviteManagement: React.FC = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    invite_type: 'general',
    max_uses: 1,
    expires_at: '',
    notes: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error loading invites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invites',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    try {
      const expiresAt = createForm.expires_at 
        ? new Date(createForm.expires_at).toISOString()
        : null;

      const { data, error } = await supabase.rpc('create_invite_code', {
        _created_by: user?.id,
        _invite_type: createForm.invite_type,
        _max_uses: createForm.max_uses,
        _expires_at: expiresAt,
        _notes: createForm.notes || null
      });

      if (error) throw error;

      const result = data as { success: boolean; code?: string; error?: string };
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Invite code created: ${result.code}`,
        });
        setShowCreateDialog(false);
        setCreateForm({
          invite_type: 'general',
          max_uses: 1,
          expires_at: '',
          notes: ''
        });
        loadInvites();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invite',
        variant: 'destructive',
      });
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: 'Invite code copied to clipboard',
    });
  };

  const getStatusIcon = (invite: Invite) => {
    if (invite.status === 'used' || invite.current_uses >= invite.max_uses) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusColor = (invite: Invite) => {
    if (invite.status === 'used' || invite.current_uses >= invite.max_uses) {
      return 'default';
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return 'destructive';
    }
    return 'secondary';
  };

  const getStatusText = (invite: Invite) => {
    if (invite.current_uses >= invite.max_uses) return 'Fully Used';
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return 'Expired';
    return 'Active';
  };

  const filteredInvites = invites.filter(invite => {
    const matchesSearch = invite.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invite.invite_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getStatusText(invite).toLowerCase();
    return matchesSearch && status.includes(filterStatus.toLowerCase());
  });

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
          <h2 className="text-2xl font-bold">Invite Management</h2>
          <p className="text-muted-foreground">Create and manage invite codes</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Invite
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <DialogHeader>
              <DialogTitle>Create New Invite Code</DialogTitle>
              <DialogDescription>
                Generate a new invite code with custom settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-type">Invite Type</Label>
                <Select 
                  value={createForm.invite_type} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, invite_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="beta">Beta Tester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="max-uses">Maximum Uses</Label>
                <Input
                  id="max-uses"
                  type="number"
                  min="1"
                  value={createForm.max_uses}
                  onChange={(e) => setCreateForm(prev => ({ 
                    ...prev, 
                    max_uses: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="expires-at">Expiration Date (optional)</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={createForm.expires_at}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this invite..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={createInvite} 
                  className="flex-1"
                  disabled={loading || !createForm.invite_type}
                >
                  {loading ? "Creating..." : "Create Invite"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    setCreateForm({
                      invite_type: 'general',
                      max_uses: 1,
                      expires_at: '',
                      notes: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Invites</p>
                <p className="text-2xl font-bold">{invites.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Used Invites</p>
                <p className="text-2xl font-bold">
                  {invites.filter(i => i.current_uses >= i.max_uses).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Invites</p>
                <p className="text-2xl font-bold">
                  {invites.filter(i => {
                    const notFullyUsed = i.current_uses < i.max_uses;
                    const notExpired = !i.expires_at || new Date(i.expires_at) > new Date();
                    return notFullyUsed && notExpired;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Uses</p>
                <p className="text-2xl font-bold">
                  {invites.reduce((sum, invite) => sum + invite.current_uses, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search invite codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invites</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="used">Fully Used</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invites List */}
      <div className="space-y-4">
        {filteredInvites.map((invite) => (
          <Card key={invite.id} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(invite)}
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-mono font-bold">
                        {invite.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyInviteCode(invite.code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>Type: {invite.invite_type}</span>
                      <span>Uses: {invite.current_uses}/{invite.max_uses}</span>
                      {invite.expires_at && (
                        <span>
                          Expires: {new Date(invite.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {invite.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {invite.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(invite)}>
                    {getStatusText(invite)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInvites.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No invites found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Create your first invite code to get started.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default InviteManagement;