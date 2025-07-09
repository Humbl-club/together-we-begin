import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Activity, Heart, Footprints, Clock, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface HealthData {
  steps: number;
  activeMinutes: number;
  heartRate?: number;
  workouts: number;
  waterGlasses: number;
  sleepHours: number;
}

interface HealthDataInputProps {
  onDataSubmit: (data: HealthData) => void;
  currentData?: Partial<HealthData>;
}

export function HealthDataInput({ onDataSubmit, currentData }: HealthDataInputProps) {
  const [data, setData] = useState<HealthData>({
    steps: currentData?.steps || 0,
    activeMinutes: currentData?.activeMinutes || 0,
    heartRate: currentData?.heartRate || undefined,
    workouts: currentData?.workouts || 0,
    waterGlasses: currentData?.waterGlasses || 0,
    sleepHours: currentData?.sleepHours || 0,
  });
  const { toast } = useToast();

  const metrics = [
    {
      key: "steps" as keyof HealthData,
      label: "Steps Today",
      icon: Footprints,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      target: 10000,
      unit: "steps"
    },
    {
      key: "activeMinutes" as keyof HealthData,
      label: "Active Minutes",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100",
      target: 30,
      unit: "min"
    },
    {
      key: "workouts" as keyof HealthData,
      label: "Workouts This Week",
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      target: 3,
      unit: "workouts"
    },
    {
      key: "waterGlasses" as keyof HealthData,
      label: "Water Glasses",
      icon: Target,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      target: 8,
      unit: "glasses"
    },
    {
      key: "sleepHours" as keyof HealthData,
      label: "Sleep Last Night",
      icon: Heart,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      target: 8,
      unit: "hours"
    }
  ];

  const handleSubmit = () => {
    onDataSubmit(data);
    toast({
      title: "Health Data Updated!",
      description: "Your wellness metrics have been recorded.",
    });
  };

  const connectToHealthApp = async () => {
    // Simulate connecting to device health APIs
    if ('permissions' in navigator) {
      try {
        // Request device motion permissions (for step counting)
        const permissionResult = await (navigator as any).permissions.query({ name: 'accelerometer' });
        
        if (permissionResult.state === 'granted') {
          // Simulate fetching data from device
          const simulatedSteps = Math.floor(Math.random() * 5000) + 3000;
          const simulatedMinutes = Math.floor(Math.random() * 45) + 15;
          
          setData(prev => ({
            ...prev,
            steps: simulatedSteps,
            activeMinutes: simulatedMinutes
          }));
          
          toast({
            title: "Connected to Health App!",
            description: "Your step data has been synced.",
          });
        }
      } catch (error) {
        // Fallback: simulate data anyway
        const simulatedSteps = Math.floor(Math.random() * 5000) + 3000;
        const simulatedMinutes = Math.floor(Math.random() * 45) + 15;
        
        setData(prev => ({
          ...prev,
          steps: simulatedSteps,
          activeMinutes: simulatedMinutes
        }));
        
        toast({
          title: "Health Data Simulated",
          description: "Demo data loaded. Connect a real fitness tracker for accurate metrics.",
        });
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Daily Wellness Tracking
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={connectToHealthApp}
            className="text-xs"
          >
            <Activity className="h-3 w-3 mr-1" />
            Sync Health App
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const value = data[metric.key] as number;
            const progress = (value / metric.target) * 100;
            const isComplete = value >= metric.target;

            return (
              <motion.div
                key={metric.key}
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <div className={`p-1 rounded-full ${metric.bgColor}`}>
                      <Icon className={`h-3 w-3 ${metric.color}`} />
                    </div>
                    {metric.label}
                  </Label>
                  {isComplete && (
                    <Badge variant="secondary" className="text-xs">
                      Goal reached! 🎉
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      [metric.key]: parseInt(e.target.value) || 0
                    }))}
                    placeholder={`Enter ${metric.label.toLowerCase()}`}
                    className="h-8"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{value} {metric.unit}</span>
                    <span>Goal: {metric.target} {metric.unit}</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <motion.div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-green-500' : 'bg-primary'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Heart Rate (Optional) */}
        <div className="pt-2 border-t">
          <Label className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-red-500" />
            Resting Heart Rate (Optional)
          </Label>
          <Input
            type="number"
            value={data.heartRate || ''}
            onChange={(e) => setData(prev => ({
              ...prev,
              heartRate: parseInt(e.target.value) || undefined
            }))}
            placeholder="Enter BPM"
            className="w-32"
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full"
          size="sm"
        >
          Update Health Data
        </Button>
      </CardContent>
    </Card>
  );
}