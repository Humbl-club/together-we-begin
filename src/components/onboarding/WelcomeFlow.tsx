import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Heart, Sparkles, Users, Trophy } from 'lucide-react';

interface WelcomeFlowProps {
  onComplete: () => void;
}

const WelcomeFlow: React.FC<WelcomeFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    instagram_handle: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user!.id);

      if (error) throw error;

      // Award welcome bonus points
      await supabase
        .from('loyalty_transactions')
        .insert([{
          user_id: user!.id,
          type: 'earned',
          points: 100,
          description: 'Welcome bonus for completing profile!',
          reference_type: 'welcome_bonus'
        }]);

      toast({
        title: "Welcome to our community! 🎉",
        description: "You've earned 100 loyalty points as a welcome bonus!"
      });

      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const steps = [
    {
      title: "Welcome to our community! ✨",
      description: "We're so excited to have you join our empowering space for women",
      icon: Heart,
      content: (
        <div className="space-y-4 text-center">
          <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <p className="text-lg">
            You're now part of a safe, supportive community where women inspire and uplift each other every day.
          </p>
        </div>
      )
    },
    {
      title: "Tell us about yourself",
      description: "Help us personalize your experience",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profileData.full_name}
              onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Your beautiful name"
            />
          </div>
          
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={profileData.username}
              onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="@yourusername"
            />
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us a bit about yourself..."
              className="min-h-[80px]"
            />
          </div>
          
          <div>
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={profileData.location}
              onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, Country"
            />
          </div>
          
          <div>
            <Label htmlFor="instagram_handle">Instagram Handle (Optional)</Label>
            <Input
              id="instagram_handle"
              value={profileData.instagram_handle}
              onChange={(e) => setProfileData(prev => ({ ...prev, instagram_handle: e.target.value }))}
              placeholder="@yourinstagram"
            />
          </div>
        </div>
      )
    },
    {
      title: "Discover what awaits you",
      description: "Your journey in our community starts now",
      icon: Trophy,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl">
              <Users className="w-8 h-8 text-pink-500 mb-2" />
              <h3 className="font-semibold mb-1">Connect & Share</h3>
              <p className="text-sm text-muted-foreground">Share your journey and connect with like-minded women</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
              <Trophy className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="font-semibold mb-1">Wellness Challenges</h3>
              <p className="text-sm text-muted-foreground">Join challenges and earn loyalty points</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <Sparkles className="w-8 h-8 text-green-500 mb-2" />
              <h3 className="font-semibold mb-1">Exclusive Events</h3>
              <p className="text-sm text-muted-foreground">Access women-only events and workshops</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
              <Heart className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-semibold mb-1">Safe Space</h3>
              <p className="text-sm text-muted-foreground">A protected environment designed for women</p>
            </div>
          </div>
          
          <div className="text-center p-4 bg-gradient-primary/10 rounded-xl">
            <h3 className="font-semibold text-lg mb-2">🎁 Welcome Bonus!</h3>
            <p className="text-sm">Complete your profile and earn 100 loyalty points to get started!</p>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="glass-card max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl gradient-text">
            {currentStep.title}
          </CardTitle>
          <p className="text-muted-foreground">
            {currentStep.description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStep.content}
          
          <div className="flex justify-between items-center pt-4">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index + 1 <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
              
              <Button
                onClick={() => {
                  if (step < steps.length) {
                    setStep(step + 1);
                  } else {
                    updateProfile();
                  }
                }}
                className="bg-primary hover:bg-primary/90"
                disabled={step === 2 && !profileData.full_name.trim()}
              >
                {step === steps.length ? 'Complete Setup' : 'Continue'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeFlow;