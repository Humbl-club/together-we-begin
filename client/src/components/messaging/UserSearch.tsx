import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url?: string | null;
}

interface UserSearchProps {
  onSelectUser: (userId: string, message: string) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', currentUser.id) // Exclude current user
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = () => {
    if (selectedUser && message.trim()) {
      onSelectUser(selectedUser.id, message.trim());
      setSelectedUser(null);
      setMessage('');
      setSearchQuery('');
      setUsers([]);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSearchQuery(user.full_name || '');
    setUsers([]);
  };

  if (selectedUser) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar>
            <AvatarImage src={selectedUser.avatar_url || undefined} />
            <AvatarFallback>
              {(selectedUser.full_name || '').split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{selectedUser.full_name || 'Unknown'}</p>
            {selectedUser.username && (
              <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedUser(null)}
            className="ml-auto"
          >
            Change
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">First Message</Label>
          <Textarea
            id="message"
            placeholder="Write your first message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {message.length}/500 characters
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleStartConversation}
            disabled={!message.trim()}
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            Start Conversation
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedUser(null);
              setMessage('');
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for users by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Searching...</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer"
              onClick={() => handleUserSelect(user)}
            >
              <Avatar>
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {(user.full_name || '').split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{user.full_name || 'Unknown'}</p>
                {user.username && (
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {searchQuery.length >= 2 && !loading && users.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No users found matching "{searchQuery}"</p>
        </div>
      )}

      {searchQuery.length < 2 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Type at least 2 characters to search for users</p>
        </div>
      )}
    </div>
  );
};