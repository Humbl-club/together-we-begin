import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Target, Calendar, Star, TrendingUp, Users, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  start_date: string | null;
  end_date: string | null;
  points_reward: number | null;
  badge_name: string | null;
  badge_image_url: string | null;
  status: string;
  created_at: string;
  user_participation?: {
    id: string;
    completed: boolean;
    completion_date: string | null;
    progress_data: any;
    joined_at: string;
  };
}

interface Profile {
  available_loyalty_points: number;
  total_loyalty_points: number;
}

const Challenges: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    instructions: '',
    start_date: '',
    end_date: '',
    points_reward: 100,
    badge_name: '',
    status: 'draft'
  });
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchChallenges();
      fetchUserProfile();
      subscribeToRealtime();
    }
  }, [user]);

  const subscribeToRealtime = () => {
    const channel = supabase
      .channel('challenges-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges'
      }, () => {
        fetchChallenges();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenge_participations'
      }, () => {
        fetchChallenges();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('available_loyalty_points, total_loyalty_points')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      // Fetch active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;

      // Fetch user participations
      const { data: participations, error: participationsError } = await supabase
        .from('challenge_participations')
        .select('*')
        .eq('user_id', user!.id);

      if (participationsError) throw participationsError;

      // Combine challenges with user participation data
      const challengesWithParticipation = challengesData?.map(challenge => ({
        ...challenge,
        user_participation: participations?.find(p => p.challenge_id === challenge.id)
      })) || [];

      setChallenges(challengesWithParticipation);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast({
        title: "Error",
        description: "Failed to load challenges",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async () => {
    if (!newChallenge.title) {
      toast({
        title: "Error",
        description: "Challenge title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const challengeData = {
        ...newChallenge,
        created_by: user!.id,
        status: newChallenge.status as 'draft' | 'active' | 'completed'
      };

      const { error } = await supabase
        .from('challenges')
        .insert(challengeData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Challenge created successfully!"
      });

      setShowCreateChallenge(false);
      setNewChallenge({
        title: '',
        description: '',
        instructions: '',
        start_date: '',
        end_date: '',
        points_reward: 100,
        badge_name: '',
        status: 'draft'
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive"
      });
    }
  };

  const joinChallenge = async (challenge: Challenge) => {
    try {
      const participationData = {
        challenge_id: challenge.id,
        user_id: user!.id,
        progress_data: { steps: 0, milestones: [] }
      };

      const { error } = await supabase
        .from('challenge_participations')
        .insert([participationData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `You've joined the ${challenge.title} challenge!`
      });

      fetchChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: "Error",
        description: "Failed to join challenge",
        variant: "destructive"
      });
    }
  };

  const updateProgress = async (challenge: Challenge, progressUpdate: any) => {
    if (!challenge.user_participation) return;

    try {
      const currentProgress = challenge.user_participation.progress_data || { steps: 0, milestones: [] };
      const newProgress = { ...currentProgress, ...progressUpdate };

      const { error } = await supabase
        .from('challenge_participations')
        .update({ progress_data: newProgress })
        .eq('id', challenge.user_participation.id);

      if (error) throw error;

      toast({
        title: "Progress Updated",
        description: "Your challenge progress has been updated!"
      });

      fetchChallenges();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const completeChallenge = async (challenge: Challenge) => {
    if (!challenge.user_participation) return;

    try {
      // Mark challenge as completed
      const { error: updateError } = await supabase
        .from('challenge_participations')
        .update({ 
          completed: true,
          completion_date: new Date().toISOString()
        })
        .eq('id', challenge.user_participation.id);

      if (updateError) throw updateError;

      // Award loyalty points
      if (challenge.points_reward && challenge.points_reward > 0) {
        const { error: pointsError } = await supabase
          .from('loyalty_transactions')
          .insert([{
            user_id: user!.id,
            type: 'earned',
            points: challenge.points_reward,
            description: `Challenge completed: ${challenge.title}`,
            reference_type: 'challenge',
            reference_id: challenge.id
          }]);

        if (pointsError) throw pointsError;
      }

      toast({
        title: "🎉 Challenge Completed!",
        description: `You've earned ${challenge.points_reward || 0} loyalty points!`
      });

      fetchChallenges();
      fetchUserProfile();
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Error",
        description: "Failed to complete challenge",
        variant: "destructive"
      });
    }
  };

  const getChallengeStatusBadge = (challenge: Challenge) => {
    if (challenge.user_participation?.completed) {
      return <Badge className="bg-green-500">Completed</Badge>;
    } else if (challenge.user_participation) {
      return <Badge variant="secondary">In Progress</Badge>;
    } else {
      return <Badge variant="outline">Available</Badge>;
    }
  };

  const getProgressPercentage = (challenge: Challenge) => {
    if (!challenge.user_participation) return 0;
    if (challenge.user_participation.completed) return 100;
    
    const progress = challenge.user_participation.progress_data;
    if (!progress) return 0;
    
    // Simple progress calculation - can be customized per challenge type
    const steps = progress.steps || 0;
    return Math.min(steps, 100); // Assuming 100 steps = 100%
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4">
        <div className="text-center">Loading challenges...</div>
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => !c.user_participation);
  const joinedChallenges = challenges.filter(c => c.user_participation && !c.user_participation.completed);
  const completedChallenges = challenges.filter(c => c.user_participation?.completed);

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Challenges</h1>
          <p className="text-muted-foreground">Complete challenges and earn loyalty points</p>
        </div>
        
        {isAdmin && (
          <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Challenge</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Challenge Title</Label>
                  <Input
                    id="title"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Challenge title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Challenge description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={newChallenge.instructions}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="How to complete this challenge"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newChallenge.start_date}
                      onChange={(e) => setNewChallenge(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newChallenge.end_date}
                      onChange={(e) => setNewChallenge(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="points_reward">Points Reward</Label>
                    <Input
                      id="points_reward"
                      type="number"
                      value={newChallenge.points_reward}
                      onChange={(e) => setNewChallenge(prev => ({ ...prev, points_reward: parseInt(e.target.value) || 0 }))}
                      placeholder="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="badge_name">Badge Name</Label>
                    <Input
                      id="badge_name"
                      value={newChallenge.badge_name}
                      onChange={(e) => setNewChallenge(prev => ({ ...prev, badge_name: e.target.value }))}
                      placeholder="Achievement badge"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newChallenge.status}
                    onValueChange={(value) => setNewChallenge(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={createChallenge} className="w-full">
                  Create Challenge
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {userProfile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Available Points</p>
                  <p className="text-2xl font-bold">{userProfile.available_loyalty_points}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Points Earned</p>
                  <p className="text-2xl font-bold">{userProfile.total_loyalty_points}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Challenges Completed</p>
                  <p className="text-2xl font-bold">{completedChallenges.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Available ({activeChallenges.length})</TabsTrigger>
          <TabsTrigger value="active">In Progress ({joinedChallenges.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedChallenges.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeChallenges.map((challenge) => (
              <Card key={challenge.id} className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      {getChallengeStatusBadge(challenge)}
                    </div>
                    {challenge.badge_name && (
                      <div className="text-right">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <p className="text-xs text-muted-foreground">{challenge.badge_name}</p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {challenge.description && (
                    <p className="text-sm text-muted-foreground">
                      {challenge.description}
                    </p>
                  )}
                  
                  {challenge.instructions && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">How to complete:</h4>
                      <p className="text-sm text-muted-foreground">
                        {challenge.instructions}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {challenge.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Starts: {new Date(challenge.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {challenge.end_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Ends: {new Date(challenge.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {challenge.points_reward && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span>{challenge.points_reward} points reward</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={() => joinChallenge(challenge)}
                  >
                    Join Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {activeChallenges.length === 0 && (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No new challenges available. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinedChallenges.map((challenge) => (
              <Card key={challenge.id} className="glass-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      {getChallengeStatusBadge(challenge)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{getProgressPercentage(challenge)}%</span>
                    </div>
                    <Progress value={getProgressPercentage(challenge)} className="h-2" />
                  </div>
                  
                  {challenge.user_participation && (
                    <div className="text-sm text-muted-foreground">
                      Joined: {new Date(challenge.user_participation.joined_at).toLocaleDateString()}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => updateProgress(challenge, { steps: (challenge.user_participation?.progress_data?.steps || 0) + 10 })}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Update Progress
                    </Button>
                    
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => completeChallenge(challenge)}
                      disabled={getProgressPercentage(challenge) < 100}
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Complete Challenge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {joinedChallenges.length === 0 && (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No challenges in progress. Join a challenge to get started!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedChallenges.map((challenge) => (
              <Card key={challenge.id} className="glass-card border-green-200 bg-green-50/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      {getChallengeStatusBadge(challenge)}
                    </div>
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {challenge.user_participation?.completion_date && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Completed on:</p>
                      <p className="font-semibold">
                        {new Date(challenge.user_participation.completion_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {challenge.points_reward && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Star className="w-4 h-4" />
                      <span className="font-semibold">+{challenge.points_reward} points earned</span>
                    </div>
                  )}
                  
                  {challenge.badge_name && (
                    <div className="text-center p-4 bg-yellow-50/10 rounded-lg">
                      <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="font-semibold text-sm">{challenge.badge_name}</p>
                      <p className="text-xs text-muted-foreground">Badge Earned</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {completedChallenges.length === 0 && (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No completed challenges yet. Start completing challenges to see them here!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Challenges;