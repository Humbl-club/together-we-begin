import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useViewport } from '@/hooks/use-mobile';
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
  const { isMobile } = useViewport();

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
    <div className="max-w-6xl mx-auto p-fluid-4 flow-content">
      {/* Hero Section */}
      <Card className="profile-hero mb-6">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Avatar Section */}
            <div className="relative">
              <Avatar className={`avatar-glow ${isMobile ? 'w-24 h-24' : 'w-32 h-32'}`}>
                <AvatarImage 
                  src={selectedAvatar ? URL.createObjectURL(selectedAvatar) : profile.avatar_url || undefined} 
                />
                <AvatarFallback className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`}>
                  {profile.full_name?.charAt(0) || profile.username?.charAt(0) || user?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              
              {editing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0 min-h-[44px] hover:scale-110 transition-transform"
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
            
            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              {!editing ? (
                <>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                      {profile.full_name || profile.username || 'Unnamed User'}
                    </h1>
                    {profile.username && profile.full_name && (
                      <p className="text-xl text-muted-foreground">@{profile.username}</p>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-lg text-muted-foreground max-w-2xl">{profile.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        <span className="text-lg">{profile.location}</span>
                      </div>
                    )}
                    
                    {profile.instagram_handle && (
                      <div className="flex items-center gap-2">
                        <Instagram className="w-5 h-5" />
                        <span className="text-lg">@{profile.instagram_handle}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6 w-full max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name" className="text-base font-medium">Full Name</Label>
                      <Input
                        id="full_name"
                        value={editedProfile.full_name || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Your full name"
                        className="mt-2 h-12 text-base"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="username" className="text-base font-medium">Username</Label>
                      <Input
                        id="username"
                        value={editedProfile.username || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Your username"
                        className="mt-2 h-12 text-base"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio" className="text-base font-medium">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editedProfile.bio || ''}
                      onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself"
                      rows={4}
                      className="mt-2 text-base"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location" className="text-base font-medium">Location</Label>
                      <Input
                        id="location"
                        value={editedProfile.location || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Your location"
                        className="mt-2 h-12 text-base"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="instagram_handle" className="text-base font-medium">Instagram Handle</Label>
                      <Input
                        id="instagram_handle"
                        value={editedProfile.instagram_handle || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, instagram_handle: e.target.value }))}
                        placeholder="Your Instagram handle"
                        className="mt-2 h-12 text-base"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Edit Button */}
            <div className="lg:ml-auto">
              {!editing ? (
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 hover:scale-105 transition-transform"
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
                    className="flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {!editing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="stats-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-amber-500/20">
                  <Star className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Available Points</p>
                  <p className="text-3xl font-bold">{profile.available_loyalty_points || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stats-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Points</p>
                  <p className="text-3xl font-bold">{profile.total_loyalty_points || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stats-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Trophy className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Challenges</p>
                  <p className="text-3xl font-bold">{completedChallenges.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabbed Content */}
      <Card className="profile-section">
        <CardHeader>
          <CardTitle className="text-2xl">Activity</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="activity" className="text-base">Activity</TabsTrigger>
              <TabsTrigger value="privacy" className="text-base">Privacy</TabsTrigger>
              <TabsTrigger value="verification" className="text-base">Verification</TabsTrigger>
              <TabsTrigger value="messages" className="text-base">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="glass-card-enhanced">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      Loyalty Points History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loyaltyTransactions.length === 0 ? (
                      <div className="text-center py-12">
                        <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No loyalty point transactions yet.</p>
                        <p className="text-sm text-muted-foreground mt-2">Complete challenges and attend events to earn points!</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {loyaltyTransactions.slice(0, 10).map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div>
                              <p className="font-medium">{transaction.description || transaction.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              variant={transaction.type === 'earned' ? 'default' : 'secondary'}
                              className="text-base px-3 py-1"
                            >
                              {transaction.type === 'earned' ? '+' : '-'}{transaction.points} points
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card-enhanced">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Completed Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {completedChallenges.length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No completed challenges yet.</p>
                        <p className="text-sm text-muted-foreground mt-2">Join challenges to showcase your achievements!</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {completedChallenges.map((participation) => (
                          <div key={participation.id} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium group-hover:text-primary transition-colors">{participation.challenges.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Completed on {new Date(participation.completion_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {participation.challenges.badge_name && (
                                  <Badge variant="outline" className="bg-primary/10">{participation.challenges.badge_name}</Badge>
                                )}
                                {participation.challenges.points_reward && (
                                  <Badge className="bg-amber-500/20 text-amber-700">+{participation.challenges.points_reward} points</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="privacy">
              <Card className="profile-section">
                <CardHeader>
                  <CardTitle className="text-xl">Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <PrivacyControls userId={user!.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification">
              <Card className="profile-section">
                <CardHeader>
                  <CardTitle className="text-xl">Profile Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileVerification 
                    userId={user!.id}
                    currentVerificationLevel="unverified"
                    onVerificationUpdate={() => {}}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card className="profile-section">
                <CardHeader>
                  <CardTitle className="text-xl">Direct Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <DirectMessaging />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;