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
  Trophy,
  Users,
  Calendar,
  Target,
  Award,
  Play,
  Pause,
  Square,
  BarChart3
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
import { EmptyState } from '@/components/ui/empty-state';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  challenge_type: string;
  start_date: string | null;
  end_date: string | null;
  step_goal: number | null;
  points_reward: number;
  winner_reward_points: number;
  runner_up_reward_points: number;
  participation_reward_points: number;
  status: 'draft' | 'active' | 'completed';
  auto_award_enabled: boolean;
  badge_name: string | null;
  badge_image_url: string | null;
  created_by: string;
  created_at: string;
  participant_count?: number;
}

const ChallengeManagement: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    instructions: '',
    challenge_type: 'one_time',
    start_date: '',
    end_date: '',
    step_goal: null as number | null,
    points_reward: 0,
    winner_reward_points: 0,
    runner_up_reward_points: 0,
    participation_reward_points: 0,
    auto_award_enabled: false,
    badge_name: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      // Get challenges with participant counts
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;

      // Get participant counts for each challenge
      const challengesWithCounts = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          const { count } = await supabase
            .from('challenge_participations')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id);
          
          return {
            ...challenge,
            participant_count: count || 0
          };
        })
      );

      setChallenges(challengesWithCounts);
    } catch (error) {
      console.error('Error loading challenges:', error);
      toast({
        title: 'Error',
        description: 'Failed to load challenges',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .insert([{
          ...createForm,
          created_by: user?.id,
          status: 'draft'
        }])
        .select()
        .single();

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_text: 'challenge_created',
        target_type_text: 'challenge',
        target_id_param: data.id,
        details_param: { title: createForm.title, type: createForm.challenge_type }
      });

      toast({
        title: 'Success',
        description: 'Challenge created successfully',
      });

      setShowCreateDialog(false);
      setCreateForm({
        title: '',
        description: '',
        instructions: '',
        challenge_type: 'one_time',
        start_date: '',
        end_date: '',
        step_goal: null,
        points_reward: 0,
        winner_reward_points: 0,
        runner_up_reward_points: 0,
        participation_reward_points: 0,
        auto_award_enabled: false,
        badge_name: ''
      });
      loadChallenges();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create challenge',
        variant: 'destructive',
      });
    }
  };

  const updateChallengeStatus = async (challengeId: string, status: 'draft' | 'active' | 'completed') => {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status })
        .eq('id', challengeId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_text: `challenge_status_changed`,
        target_type_text: 'challenge',
        target_id_param: challengeId,
        details_param: { new_status: status }
      });

      toast({
        title: 'Success',
        description: `Challenge status updated to ${status}`,
      });

      loadChallenges();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update challenge status',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'active':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Square className="w-4 h-4" />;
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'completed':
        return <Award className="w-4 h-4" />;
      case 'cancelled':
        return <Pause className="w-4 h-4" />;
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'weekly':
        return <Calendar className="w-4 h-4" />;
      case 'monthly':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = 
      challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challenge.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || challenge.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Challenge Management</h2>
          <p className="text-muted-foreground">Create and manage fitness challenges</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Challenge</DialogTitle>
              <DialogDescription>
                Create a new fitness challenge for the community
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Challenge Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter challenge title..."
                    autoComplete="off"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your challenge..."
                    rows={3}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="instructions">Scoring & Instructions</Label>
                  <Textarea
                    id="instructions"
                    name="instructions"
                    value={createForm.instructions}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Describe rules. For leaderboards, write: 'Most steps wins'. For goal: 'Reach X steps'."
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="challenge-type">Challenge Duration</Label>
                  <Select 
                    value={createForm.challenge_type} 
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, challenge_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="step-goal">Step Challenge Goal (optional)</Label>
                  <Input
                    id="step-goal"
                    name="stepGoal"
                    type="number"
                    min="0"
                    value={createForm.step_goal || ''}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      step_goal: e.target.value ? parseInt(e.target.value) : null
                    }))}
                    placeholder="e.g., 10,000 steps per day"
                    autoComplete="off"
                  />
                </div>
                
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={createForm.start_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={createForm.end_date}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="points-reward">Base Points Reward</Label>
                  <Input
                    id="points-reward"
                    type="number"
                    min="0"
                    value={createForm.points_reward}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      points_reward: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="winner-reward">Winner Bonus Points</Label>
                  <Input
                    id="winner-reward"
                    type="number"
                    min="0"
                    value={createForm.winner_reward_points}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      winner_reward_points: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="runner-up-reward">Runner-up Bonus Points</Label>
                  <Input
                    id="runner-up-reward"
                    type="number"
                    min="0"
                    value={createForm.runner_up_reward_points}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      runner_up_reward_points: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="participation-reward">Participation Points</Label>
                  <Input
                    id="participation-reward"
                    type="number"
                    min="0"
                    value={createForm.participation_reward_points}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      participation_reward_points: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="badge-name">Badge Name (optional)</Label>
                  <Input
                    id="badge-name"
                    value={createForm.badge_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, badge_name: e.target.value }))}
                    placeholder="Achievement badge name..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={createChallenge} className="flex-1">
                  Create Challenge
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
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
              <Trophy className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Challenges</p>
                <p className="text-2xl font-bold">{challenges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {challenges.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">
                  {challenges.reduce((sum, challenge) => sum + (challenge.participant_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {challenges.filter(c => c.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="search-challenges"
            name="searchChallenges"
            placeholder="Search challenges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoComplete="off"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Challenges</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        {filteredChallenges.map((challenge) => (
          <Card key={challenge.id} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2">
                      {getChallengeTypeIcon(challenge.challenge_type)}
                      {getStatusIcon(challenge.status)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{challenge.title}</h3>
                        <Badge variant={getStatusColor(challenge.status)}>
                          {challenge.status}
                        </Badge>
                        <Badge variant="outline">
                          {challenge.challenge_type}
                        </Badge>
                      </div>
                      
                      {challenge.description && (
                        <p className="text-muted-foreground mb-2">
                          {challenge.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {challenge.step_goal && (
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {challenge.step_goal.toLocaleString()} steps
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {challenge.points_reward} points
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {challenge.participant_count} participants
                        </div>
                        
                        {challenge.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(challenge.start_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {challenge.winner_reward_points > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Bonus: Winner +{challenge.winner_reward_points}, 
                          Runner-up +{challenge.runner_up_reward_points}, 
                          Participation +{challenge.participation_reward_points}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select onValueChange={(value) => updateChallengeStatus(challenge.id, value as 'draft' | 'active' | 'completed')}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Actions..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Set Draft</SelectItem>
                      <SelectItem value="active">Activate</SelectItem>
                      <SelectItem value="completed">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChallenges.length === 0 && (
        <EmptyState
          icon={<Trophy className="w-full h-full" />}
          title="No challenges found"
          description={searchTerm ? 'Try adjusting your search terms.' : 'Create your first challenge to get started.'}
          action={!searchTerm ? {
            label: "Create Challenge",
            onClick: () => setShowCreateDialog(true),
            variant: "default"
          } : undefined}
        />
      )}
    </div>
  );
};

export default ChallengeManagement;