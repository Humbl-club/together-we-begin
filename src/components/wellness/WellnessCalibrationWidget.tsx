import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, CheckCircle } from 'lucide-react';
import { pedometerService } from '@/services/PedometerService';
import { useToast } from '@/hooks/use-toast';

export const WellnessCalibrationWidget: React.FC = () => {
  const [calibrationStatus, setCalibrationStatus] = useState({
    factor: 1.0,
    samples: 0,
    isCalibrated: false
  });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    updateCalibrationStatus();
    
    // Update status every 5 seconds during calibration
    const interval = setInterval(() => {
      if (isCalibrating) {
        updateCalibrationStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isCalibrating]);

  const updateCalibrationStatus = () => {
    const status = pedometerService.getCalibrationStatus();
    setCalibrationStatus(status);
    
    if (status.isCalibrated && isCalibrating) {
      setIsCalibrating(false);
      toast({
        title: "Calibration Complete!",
        description: "Your step tracking is now optimized for your walking pattern."
      });
    }
  };

  const startCalibration = () => {
    setIsCalibrating(true);
    toast({
      title: "Calibration Started",
      description: "Walk normally for the next few minutes to improve accuracy."
    });
  };

  const calibrationProgress = Math.min((calibrationStatus.samples / 50) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Step Tracking Calibration</span>
          {calibrationStatus.isCalibrated && (
            <Badge variant="default" className="ml-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              Calibrated
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Calibration helps improve step counting accuracy for your unique walking pattern.
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Calibration Progress</span>
            <span>{calibrationStatus.samples}/50 samples</span>
          </div>
          <Progress value={calibrationProgress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">
              {calibrationStatus.factor.toFixed(2)}x
            </div>
            <div className="text-xs text-muted-foreground">
              Calibration Factor
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-primary">
              {Math.round(calibrationProgress)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Complete
            </div>
          </div>
        </div>

        {!calibrationStatus.isCalibrated && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Tip:</strong> Walk naturally for a few minutes to automatically calibrate your step tracking for maximum accuracy.
            </div>
          </div>
        )}

        {calibrationStatus.isCalibrated && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span>Your step tracking is optimized for your walking pattern!</span>
            </div>
          </div>
        )}

        {!isCalibrating && !calibrationStatus.isCalibrated && (
          <Button onClick={startCalibration} className="w-full">
            <TrendingUp className="w-4 h-4 mr-2" />
            Start Calibration
          </Button>
        )}

        {isCalibrating && (
          <div className="text-center text-sm text-muted-foreground">
            <div className="animate-pulse">Calibrating... Keep walking normally</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};