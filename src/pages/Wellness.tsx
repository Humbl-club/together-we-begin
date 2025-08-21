import { useState, useEffect } from 'react';
import { CardKit, CardKitContent, CardKitHeader, CardKitTitle } from '@/components/ui/card-kit';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Heart, Target, TrendingUp, Calendar, Plus, Award } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { WellnessWidget } from '@/components/wellness/WellnessWidget';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/seo/SEO';
import { PageSection } from '@/components/sections/PageSection';
import { SectionHeader } from '@/components/sections/SectionHeader';

export default function Wellness() {
  const [weeklyGoals, setWeeklyGoals] = useState({
    steps: 70000,
    activeMinutes: 420,
    workouts: 5,
    sleepHours: 56
  });

  const [weeklyProgress, setWeeklyProgress] = useState({
    steps: 45200,
    activeMinutes: 285,
    workouts: 3,
    sleepHours: 42
  });

  const [healthMetrics, setHealthMetrics] = useState({
    weight: 65,
    heartRate: 72,
    bloodPressure: '120/80',
    waterIntake: 6
  });

  const { toast } = useToast();

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const logWaterIntake = () => {
    setHealthMetrics(prev => ({
      ...prev,
      waterIntake: prev.waterIntake + 1
    }));
    toast({
      title: "Water logged!",
      description: "Keep staying hydrated! 💧",
    });
  };

  const achievements = [
    { id: 1, title: "Step Master", description: "Walked 10,000+ steps for 7 days", icon: "🚶‍♀️", earned: true },
    { id: 2, title: "Early Bird", description: "Completed morning workouts for 5 days", icon: "🌅", earned: true },
    { id: 3, title: "Hydration Hero", description: "Drank 8 glasses of water daily", icon: "💧", earned: false },
    { id: 4, title: "Sleep Champion", description: "Got 8+ hours sleep for a week", icon: "😴", earned: false }
  ];

  return (
    <Layout>
      <SEO title="Wellness" description="Track your health and wellness journey." canonical="/wellness" />
      <h1 className="sr-only">Wellness</h1>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <PageSection surface="accent" className="mb-2">
            <SectionHeader title="Wellness" subtitle="Track your health and wellness journey" />
          </PageSection>

          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <WellnessWidget />
                </div>
                
                <CardKit className="animate-fade-in">
                  <CardKitHeader>
                    <CardKitTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      Quick Actions
                    </CardKitTitle>
                  </CardKitHeader>
                  <CardKitContent className="space-y-3">
                    <Button onClick={logWaterIntake} variant="outline" className="w-full justify-start" haptic="tap">
                      💧 Log Water Intake ({healthMetrics.waterIntake}/8 glasses)
                    </Button>
                    <Button variant="outline" className="w-full justify-start" haptic="tap">
                      🏃‍♀️ Log Workout
                    </Button>
                    <Button variant="outline" className="w-full justify-start" haptic="tap">
                      😴 Log Sleep
                    </Button>
                    <Button variant="outline" className="w-full justify-start" haptic="tap">
                      ⚖️ Log Weight
                    </Button>
                  </CardKitContent>
                </CardKit>

                <CardKit className="animate-fade-in">
                  <CardKitHeader>
                    <CardKitTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-accent" />
                      This Week
                    </CardKitTitle>
                  </CardKitHeader>
                  <CardKitContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Workouts Completed</span>
                        <span>{weeklyProgress.workouts}/5</span>
                      </div>
                      <Progress value={(weeklyProgress.workouts / 5) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Active Minutes</span>
                        <span>{weeklyProgress.activeMinutes}/420</span>
                      </div>
                      <Progress value={getProgressPercentage(weeklyProgress.activeMinutes, 420)} className="h-2" />
                    </div>
                  </CardKitContent>
                </CardKit>
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <CardKit className="animate-fade-in">
                  <CardKitHeader>
                    <CardKitTitle>Weekly Goals Progress</CardKitTitle>
                  </CardKitHeader>
                  <CardKitContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Steps</span>
                          <span>{weeklyProgress.steps.toLocaleString()} / {weeklyGoals.steps.toLocaleString()}</span>
                        </div>
                        <Progress value={getProgressPercentage(weeklyProgress.steps, weeklyGoals.steps)} />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Active Minutes</span>
                          <span>{weeklyProgress.activeMinutes} / {weeklyGoals.activeMinutes}</span>
                        </div>
                        <Progress value={getProgressPercentage(weeklyProgress.activeMinutes, weeklyGoals.activeMinutes)} />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Workouts</span>
                          <span>{weeklyProgress.workouts} / {weeklyGoals.workouts}</span>
                        </div>
                        <Progress value={getProgressPercentage(weeklyProgress.workouts, weeklyGoals.workouts)} />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Sleep Hours</span>
                          <span>{weeklyProgress.sleepHours} / {weeklyGoals.sleepHours}</span>
                        </div>
                        <Progress value={getProgressPercentage(weeklyProgress.sleepHours, weeklyGoals.sleepHours)} />
                      </div>
                    </div>
                  </CardKitContent>
                </CardKit>

                <CardKit className="animate-fade-in">
                  <CardKitHeader>
                    <CardKitTitle>Weekly Summary</CardKitTitle>
                  </CardKitHeader>
                  <CardKitContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-semibold text-foreground">Great Progress!</p>
                          <p className="text-sm text-muted-foreground">You're 65% towards your weekly goals</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-primary" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 border rounded-lg">
                          <div className="text-2xl font-bold text-primary">3</div>
                          <div className="text-xs text-muted-foreground">Days Active</div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="text-2xl font-bold text-accent">2</div>
                          <div className="text-xs text-muted-foreground">Goals Met</div>
                        </div>
                      </div>
                    </div>
                  </CardKitContent>
                </CardKit>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <CardKit className="animate-fade-in">
                  <CardKitHeader>
                    <CardKitTitle>Current Health Metrics</CardKitTitle>
                  </CardKitHeader>
                  <CardKitContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Weight (kg)</Label>
                        <Input type="number" value={healthMetrics.weight} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Resting Heart Rate</Label>
                        <Input value={`${healthMetrics.heartRate} bpm`} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Blood Pressure</Label>
                        <Input value={healthMetrics.bloodPressure} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Water Intake Today</Label>
                        <Input value={`${healthMetrics.waterIntake}/8 glasses`} readOnly />
                      </div>
                    </div>
                    <Button className="w-full" haptic="light">
                      <Plus className="h-4 w-4 mr-2" />
                      Update Metrics
                    </Button>
                  </CardKitContent>
                </CardKit>

                <CardKit className="animate-fade-in">
                  <CardKitHeader>
                    <CardKitTitle>Health Trends</CardKitTitle>
                  </CardKitHeader>
                  <CardKitContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Weight Trend</h4>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Stable over the last 30 days</span>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Heart Rate</h4>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Average: 72 bpm (Excellent)</span>
                        </div>
                      </div>
                    </div>
                  </CardKitContent>
                </CardKit>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              <CardKit className="animate-fade-in">
                <CardKitHeader>
                  <CardKitTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-accent" />
                    Your Achievements
                  </CardKitTitle>
                </CardKitHeader>
                <CardKitContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 border rounded-lg flex items-center gap-3 ${
                          achievement.earned ? 'bg-accent/10 border-accent/30' : 'opacity-50'
                        }`}
                      >
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                        {achievement.earned && (
                          <Badge variant="secondary">Earned!</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardKitContent>
              </CardKit>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}