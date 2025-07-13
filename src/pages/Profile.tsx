import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useViewport, useResponsiveValue } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, Star, Trophy, MapPin, Instagram, Edit3, Save, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PrivacyControls } from '@/components/profile/PrivacyControls';
import { ProfileVerification } from '@/components/profile/ProfileVerification';
import { DirectMessaging } from '@/components/messaging/DirectMessaging';

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  instagram_handle: string | null;
  available_loyalty_points: number | null;
  total_loyalty_points: number | null;
  created_at: string;
}

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
  reference_type: string | null;
}

interface CompletedChallenge {
  id: string;
  completion_date: string;
  challenges: {
    title: string;
    badge_name: string | null;
    points_reward: number | null;
  };
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile, isTablet } = useViewport();

  // Responsive values
  const containerPadding = useResponsiveValue({
    mobile: 'p-4',
    tablet: 'p-5', 
    desktop: 'p-6',
    default: 'p-6'
  });

  const cardSpacing = useResponsiveValue({
    mobile: 'space-y-4',
    tablet: 'space-y-5',
    desktop: 'space-y-6', 
    default: 'space-y-6'
  });

  const avatarSize = useResponsiveValue({
    mobile: 'avatar-responsive-lg',
    tablet: 'avatar-responsive-lg',
    desktop: 'avatar-responsive-lg',
    default: 'w-24 h-24'
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchLoyaltyTransactions();
      fetchCompletedChallenges();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLoyaltyTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLoyaltyTransactions(data || []);
    } catch (error) {
      console.error('Error fetching loyalty transactions:', error);
    }
  };

  const fetchCompletedChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_participations')
        .select(`
          id,
          completion_date,
          challenges!challenge_participations_challenge_id_fkey (
            title,
            badge_name,
            points_reward
          )
        `)
        .eq('user_id', user!.id)
        .eq('completed', true)
        .order('completion_date', { ascending: false });

      if (error) throw error;
      setCompletedChallenges(data || []);
    } catch (error) {
      console.error('Error fetching completed challenges:', error);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileName = `avatar_${user!.id}_${Date.now()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
      return null;
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);

      let avatarUrl = editedProfile.avatar_url;

      // Upload new avatar if selected
      if (selectedAvatar) {
        const uploadedUrl = await uploadAvatar(selectedAvatar);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const updateData = {
        ...editedProfile,
        avatar_url: avatarUrl
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user!.id);

      if (error) throw error;

      setProfile({ ...profile!, ...updateData });
      setEditing(false);
      setSelectedAvatar(null);

      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatar(file);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditedProfile(profile || {});
    setSelectedAvatar(null);
  };

  if (loading && !profile) {
    return (
      <div className="responsive-container max-w-4xl mx-auto mobile:p-4 sm:p-6">
        <Card className="glass-card">
          <CardContent className="text-center mobile:py-8 sm:py-12">
            <div className="animate-pulse spacing-responsive-md">
              <div className="mobile:w-16 mobile:h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-muted rounded-full mx-auto"></div>
              <div className="spacing-responsive-sm">
                <div className="mobile:h-4 sm:h-5 lg:h-6 bg-muted rounded mobile:w-36 sm:w-48 mx-auto"></div>
                <div className="mobile:h-3 sm:h-4 bg-muted rounded mobile:w-24 sm:w-32 mx-auto"></div>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 mobile:text-sm sm:text-base">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="responsive-container max-w-4xl mx-auto mobile:p-4 sm:p-6">
        <Card className="glass-card">
          <CardContent className="text-center mobile:py-8 sm:py-12 spacing-responsive-md">
            <div className="mobile:w-12 mobile:h-12 sm:w-16 sm:h-16 bg-muted rounded-full mx-auto opacity-50"></div>
            <div>
              <h3 className="mobile:text-base sm:text-lg font-semibold">Profile not found</h3>
              <p className="text-muted-foreground mobile:text-sm sm:text-base">We couldn't load your profile. Please try refreshing the page.</p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" className="btn-responsive">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`responsive-container max-w-4xl mx-auto ${containerPadding} ${cardSpacing}`}>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile</CardTitle>
            {!editing ? (
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  onClick={saveProfile}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className={`flex ${isMobile ? 'flex-col items-center' : 'items-start'} gap-6`}>
            <div className="relative">
              <Avatar className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'}`}>
                <AvatarImage 
                  src={selectedAvatar ? URL.createObjectURL(selectedAvatar) : profile.avatar_url || undefined} 
                />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.charAt(0) || profile.username?.charAt(0) || user?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              
              {editing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
              
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
            
            <div className="flex-1 space-y-4">
              {!editing ? (
                <>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {profile.full_name || profile.username || 'Unnamed User'}
                    </h2>
                    {profile.username && profile.full_name && (
                      <p className="text-muted-foreground">@{profile.username}</p>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    
                    {profile.instagram_handle && (
                      <div className="flex items-center gap-1">
                        <Instagram className="w-4 h-4" />
                        <span>@{profile.instagram_handle}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span>{profile.total_loyalty_points || 0} total points</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={editedProfile.full_name || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={editedProfile.username || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Your username"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editedProfile.bio || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>
                  
                  <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editedProfile.location || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Your location"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="instagram_handle">Instagram Handle</Label>
                      <Input
                        id="instagram_handle"
                        value={editedProfile.instagram_handle || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, instagram_handle: e.target.value }))}
                        placeholder="Your Instagram handle"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {!editing && (
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Available Points</p>
                      <p className="text-2xl font-bold">{profile.available_loyalty_points || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Points</p>
                      <p className="text-2xl font-bold">{profile.total_loyalty_points || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Challenges</p>
                      <p className="text-2xl font-bold">{completedChallenges.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {!editing && (
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-5'}`}>
            <TabsTrigger value="activity" className={isMobile ? 'text-xs' : ''}>Activity</TabsTrigger>
            {!isMobile && <TabsTrigger value="achievements">Achievements</TabsTrigger>}
            <TabsTrigger value="verification" className={isMobile ? 'text-xs' : ''}>Verification</TabsTrigger>
            {!isMobile && <TabsTrigger value="privacy">Privacy</TabsTrigger>}
            {!isMobile && <TabsTrigger value="messages">Messages</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Loyalty Points History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loyaltyTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type === 'earned' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">
                            {transaction.description || `Points ${transaction.type}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`font-bold ${
                        transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                      </div>
                    </div>
                  ))}
                  
                  {loyaltyTransactions.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No activity yet. Complete challenges to earn points!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="achievements" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Completed Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedChallenges.map((challenge) => (
                    <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <div>
                          <p className="font-medium">{challenge.challenges.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Completed on {new Date(challenge.completion_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {challenge.challenges.badge_name && (
                          <Badge variant="secondary" className="mb-1">
                            {challenge.challenges.badge_name}
                          </Badge>
                        )}
                        {challenge.challenges.points_reward && (
                          <p className="text-sm font-medium text-green-600">
                            +{challenge.challenges.points_reward} points
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {completedChallenges.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No achievements yet. Complete your first challenge!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <ProfileVerification 
              userId={user!.id}
              currentVerificationLevel="unverified"
              onVerificationUpdate={(level) => {
                console.log('Verification updated:', level)
              }}
            />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <PrivacyControls userId={user!.id} />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Direct Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <DirectMessaging currentUserId={user!.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Profile;