import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useViewport } from '@/hooks/use-mobile';
import { useOptimizedProfileData } from '@/hooks/useOptimizedProfileData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { validateImageFile } from '@/utils/fileValidation';
import { Camera, MapPin, Instagram, Edit3, Save, X, CheckCircle, Star, Trophy, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrivacyControls } from '@/components/profile/PrivacyControls';
import type { Profile } from '@/types/database.types';


import { AnimatedStats } from '@/components/profile/AnimatedStats';
import { ProgressRing } from '@/components/profile/ProgressRing';
import { AchievementsDisplay } from '@/components/profile/AchievementsDisplay';
import { LoyaltyTimeline } from '@/components/profile/LoyaltyTimeline';


const Profile: React.FC = () => {
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isMobile } = useViewport();
  
  const { 
    profile, 
    loyaltyTransactions, 
    completedChallenges, 
    loading, 
    updateProfile 
  } = useOptimizedProfileData(user?.id);

  // Initialize editedProfile when profile loads
  React.useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

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

    const success = await updateProfile(updateData);
    
    if (success) {
      setEditing(false);
      setSelectedAvatar(null);
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = await validateImageFile(file, 2); // 2MB limit for avatars
      
      if (!validation.valid) {
        toast({
          title: "Invalid Image",
          description: validation.error,
          variant: "destructive"
        });
        return;
      }
      
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-secondary/10">
      <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-8">
        {/* Hero Section */}
        <Card className="card-glass border-0 shadow-hero backdrop-blur-xl overflow-hidden">
          <CardContent className="relative p-8 lg:p-12">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            
            <div className="relative flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                <div className="relative">
                  <Avatar className={`ring-4 ring-primary/20 shadow-avatar transition-all duration-500 hover:ring-primary/40 hover:shadow-glow ${isMobile ? 'w-28 h-28' : 'w-36 h-36'}`}>
                    <AvatarImage 
                      src={selectedAvatar ? URL.createObjectURL(selectedAvatar) : profile.avatar_url || undefined} 
                      className="object-cover"
                    />
                    <AvatarFallback className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold bg-gradient-to-br from-primary/20 to-secondary/20 text-primary`}>
                      {profile.full_name?.charAt(0) || profile.username?.charAt(0) || user?.email?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-background shadow-sm" />
                </div>
                
                {editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="card-glass absolute -bottom-3 -right-3 rounded-full w-12 h-12 p-0 hover:scale-110 transition-all duration-300 border-primary/30 shadow-button"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                )}
                
                <input
                  id="avatar-upload"
                  name="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 text-center lg:text-left space-y-6 min-w-0">
                {!editing ? (
                  <>
                    <div className="space-y-3">
                      <h1 className="text-3xl lg:text-5xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {profile.full_name || profile.username || 'Unnamed User'}
                      </h1>
                      {profile.username && profile.full_name && (
                        <p className="text-xl lg:text-2xl text-muted-foreground font-medium">@{profile.username}</p>
                      )}
                    </div>
                    
                    {profile.bio && (
                      <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">{profile.bio}</p>
                    )}
                    
                    <div className="flex flex-wrap justify-center lg:justify-start gap-6 lg:gap-8 text-muted-foreground">
                      {profile.location && (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-secondary/20 backdrop-blur-sm">
                          <MapPin className="w-5 h-5 flex-shrink-0 text-primary" />
                          <span className="text-base lg:text-lg font-medium">{profile.location}</span>
                        </div>
                      )}
                      
                      {profile.instagram_handle && (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-secondary/20 backdrop-blur-sm">
                          <Instagram className="w-5 h-5 flex-shrink-0 text-primary" />
                          <span className="text-base lg:text-lg font-medium">@{profile.instagram_handle}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-8 w-full max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="full_name" className="text-lg font-semibold text-foreground">Full Name</Label>
                        <Input
                          id="full_name"
                          value={editedProfile.full_name || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Your full name"
                          className="h-14 text-lg rounded-xl border-primary/20 focus:border-primary bg-background/50 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="username" className="text-lg font-semibold text-foreground">Username</Label>
                        <Input
                          id="username"
                          value={editedProfile.username || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Your username"
                          className="h-14 text-lg rounded-xl border-primary/20 focus:border-primary bg-background/50 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="bio" className="text-lg font-semibold text-foreground">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editedProfile.bio || ''}
                        onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself"
                        rows={4}
                        className="text-lg rounded-xl border-primary/20 focus:border-primary bg-background/50 backdrop-blur-sm resize-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="location" className="text-lg font-semibold text-foreground">Location</Label>
                        <Input
                          id="location"
                          value={editedProfile.location || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Your location"
                          className="h-14 text-lg rounded-xl border-primary/20 focus:border-primary bg-background/50 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="instagram_handle" className="text-lg font-semibold text-foreground">Instagram Handle</Label>
                        <Input
                          id="instagram_handle"
                          value={editedProfile.instagram_handle || ''}
                          onChange={(e) => setEditedProfile(prev => ({ ...prev, instagram_handle: e.target.value }))}
                          placeholder="Your Instagram handle"
                          className="h-14 text-lg rounded-xl border-primary/20 focus:border-primary bg-background/50 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Edit Button */}
              <div className="lg:ml-auto flex-shrink-0">
                {!editing ? (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="card-glass px-6 py-3 h-auto text-lg font-semibold rounded-xl border-primary/30 hover:border-primary hover:scale-105 transition-all duration-300 shadow-button"
                  >
                    <Edit3 className="w-5 h-5 mr-2" />
                    {!isMobile && "Edit Profile"}
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={cancelEdit}
                      className="card-glass px-6 py-3 h-auto text-lg font-semibold rounded-xl border-red-200 hover:border-red-300"
                    >
                      <X className="w-5 h-5 mr-2" />
                      {!isMobile && "Cancel"}
                    </Button>
                    <Button
                      onClick={saveProfile}
                      disabled={loading}
                      className="px-6 py-3 h-auto text-lg font-semibold rounded-xl hover:scale-105 transition-transform shadow-button"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {!isMobile && "Save"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        {!editing && (
          <div className="animate-fade-in">
            <AnimatedStats
              totalPoints={profile.total_loyalty_points || 0}
              availablePoints={profile.available_loyalty_points || 0}
              completedChallenges={completedChallenges.length}
            />
          </div>
        )}

        {/* Profile Completion Section */}
        {!editing && (
          <Card className="card-glass border-0 shadow-section backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-4 text-2xl lg:text-3xl font-display">
                <div className="p-3 rounded-full bg-primary/10">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                Profile Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex-shrink-0">
                  <ProgressRing 
                    percentage={(() => {
                      let completed = 0;
                      const total = 6;
                      if (profile.full_name) completed++;
                      if (profile.username) completed++;
                      if (profile.bio) completed++;
                      if (profile.location) completed++;
                      if (profile.instagram_handle) completed++;
                      if (profile.avatar_url) completed++;
                      return (completed / total) * 100;
                    })()}
                  />
                </div>
                <div className="flex-1 w-full space-y-6">
                  <h3 className="text-xl lg:text-2xl font-semibold text-center lg:text-left">Complete your profile to unlock more features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { field: 'full_name', label: 'Full Name', completed: !!profile.full_name },
                      { field: 'username', label: 'Username', completed: !!profile.username },
                      { field: 'bio', label: 'Bio', completed: !!profile.bio },
                      { field: 'location', label: 'Location', completed: !!profile.location },
                      { field: 'instagram_handle', label: 'Instagram Handle', completed: !!profile.instagram_handle },
                      { field: 'avatar_url', label: 'Profile Picture', completed: !!profile.avatar_url }
                    ].map((item) => (
                      <div key={item.field} className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                        item.completed ? 'bg-primary/5 border border-primary/20' : 'bg-muted/20 border border-muted/30'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                          item.completed ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted border-2 border-muted-foreground/20'
                        }`}>
                          {item.completed && <CheckCircle className="w-4 h-4" />}
                        </div>
                        <span className={`font-medium ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabbed Content */}
        <Card className="card-glass border-0 shadow-section backdrop-blur-xl overflow-hidden">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl lg:text-3xl font-display">Activity & Settings</CardTitle>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="card-glass grid w-full grid-cols-2 mb-8 p-2 h-auto rounded-xl">
                <TabsTrigger value="activity" className="text-base lg:text-lg font-semibold py-3 rounded-lg data-[state=active]:shadow-sm">
                  Activity
                </TabsTrigger>
                <TabsTrigger value="privacy" className="text-base lg:text-lg font-semibold py-3 rounded-lg data-[state=active]:shadow-sm">
                  Privacy
                </TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <AchievementsDisplay challenges={completedChallenges} />
                  </div>
                  <div className="space-y-6">
                    <LoyaltyTimeline transactions={loyaltyTransactions} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="privacy" className="animate-fade-in">
                <Card className="card-glass border-0 shadow-inner">
                  <CardHeader>
                    <CardTitle className="text-xl lg:text-2xl font-semibold flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      Privacy Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PrivacyControls userId={user!.id} />
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;