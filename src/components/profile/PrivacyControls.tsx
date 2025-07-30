import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Lock, Eye, MessageCircle, MapPin, UserCheck } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useMobileFirst } from '@/hooks/useMobileFirst'
import { MobileContainer } from '@/components/ui/mobile-container'

interface PrivacySettings {
  profile_visibility: 'public' | 'members_only' | 'private'
  allow_direct_messages: boolean
  show_location: boolean
  show_activity_status: boolean
  allow_event_invites: boolean
  allow_group_invites: boolean
  blocked_users: string[]
}

interface PrivacyControlsProps {
  userId: string
}

export const PrivacyControls = ({ userId }: PrivacyControlsProps) => {
  const { isMobile } = useMobileFirst();
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: 'members_only',
    allow_direct_messages: true,
    show_location: false,
    show_activity_status: true,
    allow_event_invites: true,
    allow_group_invites: true,
    blocked_users: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPrivacySettings()
  }, [userId])

  const loadPrivacySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load privacy settings:', error)
        return
      }

      if (data) {
        setSettings({
          profile_visibility: data.profile_visibility as 'public' | 'members_only' | 'private',
          allow_direct_messages: data.allow_messages !== 'none',
          show_location: data.allow_location_sharing,
          show_activity_status: data.show_activity_status,
          allow_event_invites: data.allow_friend_requests,
          allow_group_invites: data.allow_friend_requests,
          blocked_users: []
        })
      }

      // Load blocked users
      const { data: blockedData } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', userId)

      if (blockedData) {
        setSettings(prev => ({
          ...prev,
          blocked_users: blockedData.map(item => item.blocked_id)
        }))
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePrivacySettings = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: userId,
          profile_visibility: settings.profile_visibility,
          allow_messages: settings.allow_direct_messages ? 'everyone' : 'none',
          allow_location_sharing: settings.show_location,
          show_activity_status: settings.show_activity_status,
          allow_friend_requests: settings.allow_event_invites
        })

      if (error) throw error
      
      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved."
      })
    } catch (error) {
      console.error('Failed to save privacy settings:', error)
      toast({
        title: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (key: keyof PrivacySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const blockUser = async (targetUserId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: userId,
          blocked_id: targetUserId
        })

      if (error) throw error

      const updatedBlocked = [...settings.blocked_users, targetUserId]
      setSettings(prev => ({ ...prev, blocked_users: updatedBlocked }))
      
      toast({
        title: "User blocked",
        description: "This user will no longer be able to contact you."
      })
    } catch (error) {
      console.error('Failed to block user:', error)
      toast({
        title: "Failed to block user",
        variant: "destructive"
      })
    }
  }

  const unblockUser = async (targetUserId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', userId)
        .eq('blocked_id', targetUserId)

      if (error) throw error

      const updatedBlocked = settings.blocked_users.filter(id => id !== targetUserId)
      setSettings(prev => ({ ...prev, blocked_users: updatedBlocked }))
      
      toast({
        title: "User unblocked",
        description: "This user can now contact you again."
      })
    } catch (error) {
      console.error('Failed to unblock user:', error)
      toast({
        title: "Failed to unblock user",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return <div>Loading privacy settings...</div>
  }

  return (
    <MobileContainer>
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
            <Lock className="h-5 w-5" />
            Privacy & Safety
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
        {/* Profile Visibility */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <h4 className="font-medium">Profile Visibility</h4>
          </div>
          <Select
            value={settings.profile_visibility}
            onValueChange={(value: 'public' | 'members_only' | 'private') => 
              updateSetting('profile_visibility', value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div className="space-y-1">
                  <div>Public</div>
                  <div className="text-xs text-muted-foreground">
                    Anyone can see your profile
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="members_only">
                <div className="space-y-1">
                  <div>Members Only</div>
                  <div className="text-xs text-muted-foreground">
                    Only community members can see your profile
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="space-y-1">
                  <div>Private</div>
                  <div className="text-xs text-muted-foreground">
                    Only you can see your full profile
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Communication Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <h4 className="font-medium">Communication</h4>
          </div>
          
          <div className="space-y-4">
            <div className={`flex items-center justify-between ${isMobile ? 'gap-3' : ''}`}>
              <div className="flex-1">
                <div className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Allow Direct Messages</div>
                <div className="text-xs text-muted-foreground">
                  Let other members send you private messages
                </div>
              </div>
              <Switch
                checked={settings.allow_direct_messages}
                onCheckedChange={(checked) => updateSetting('allow_direct_messages', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Event Invitations</div>
                <div className="text-xs text-muted-foreground">
                  Allow members to invite you to events
                </div>
              </div>
              <Switch
                checked={settings.allow_event_invites}
                onCheckedChange={(checked) => updateSetting('allow_event_invites', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Group Invitations</div>
                <div className="text-xs text-muted-foreground">
                  Allow members to invite you to groups
                </div>
              </div>
              <Switch
                checked={settings.allow_group_invites}
                onCheckedChange={(checked) => updateSetting('allow_group_invites', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Activity & Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <h4 className="font-medium">Activity & Location</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Show Activity Status</div>
                <div className="text-xs text-muted-foreground">
                  Let others see when you're online
                </div>
              </div>
              <Switch
                checked={settings.show_activity_status}
                onCheckedChange={(checked) => updateSetting('show_activity_status', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Show Location</div>
                <div className="text-xs text-muted-foreground">
                  Display your city on your profile
                </div>
              </div>
              <Switch
                checked={settings.show_location}
                onCheckedChange={(checked) => updateSetting('show_location', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Blocked Users */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <h4 className="font-medium">Blocked Users</h4>
          </div>
          
          {settings.blocked_users.length > 0 ? (
            <div className="space-y-2">
              {settings.blocked_users.map((blockedUserId) => (
                <div key={blockedUserId} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">User {blockedUserId.slice(0, 8)}...</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unblockUser(blockedUserId)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No blocked users</p>
          )}
        </div>

        <Separator />

        <Button 
          onClick={savePrivacySettings} 
          disabled={isSaving} 
          className="w-full"
          size={isMobile ? "default" : "default"}
        >
          {isSaving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
        </CardContent>
      </Card>
    </MobileContainer>
  )
}