import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Camera, CameraOff, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';

interface QRCodeScannerProps {
  onScanSuccess?: (result: any) => void;
  onScanError?: (error: string) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScanSuccess,
  onScanError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if camera is available
    QrScanner.hasCamera().then(setHasCamera);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current || !hasCamera) return;

    try {
      setIsScanning(true);
      setScanning(true);

      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      scannerRef.current = scanner;
      await scanner.start();
    } catch (error) {
      console.error('Error starting scanner:', error);
      setIsScanning(false);
      setScanning(false);
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScanning(false);
  };

  const handleScanResult = async (qrToken: string) => {
    if (!user?.id || scanning) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to mark attendance',
        variant: 'destructive'
      });
      return;
    }

    setScanning(true);
    
    try {
      // Call the attendance marking function
      const { data, error } = await supabase.rpc('mark_event_attendance', {
        event_qr_token: qrToken,
        scanning_user_id: user.id
      });

      if (error) {
        throw error;
      }

      const result = data as { 
        success: boolean; 
        event_title?: string; 
        points_awarded?: number; 
        error?: string;
        already_attended?: boolean;
      };

      setLastScanResult(result);

      if (result.success) {
        stopScanning();
        onScanSuccess?.(result);
        
        toast({
          title: 'Attendance Recorded!',
          description: `You've been marked as attended for "${result.event_title}" and earned ${result.points_awarded} points!`,
        });
      } else {
        onScanError?.(result.error || 'Unknown error');
        
        const variant = result.already_attended ? 'default' : 'destructive';
        
        toast({
          title: result.already_attended ? 'Already Attended' : 'Scan Failed',
          description: result.error || 'Failed to mark attendance',
          variant
        });
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      onScanError?.(error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: 'Error',
        description: 'Failed to mark attendance. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setScanning(false);
    }
  };

  if (!hasCamera) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CameraOff className="w-5 h-5" />
            Camera Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              No camera detected. QR code scanning requires camera access.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Scan Event QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastScanResult?.success && (
          <Alert>
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Attendance recorded for "{lastScanResult.event_title}"! 
              {lastScanResult.points_awarded > 0 && (
                <span>+{lastScanResult.points_awarded} points earned!</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {!isScanning ? (
            <div className="text-center space-y-4">
              <div className="w-48 h-48 bg-muted rounded-lg mx-auto flex items-center justify-center">
                <Camera className="w-12 h-12 text-muted-foreground" />
              </div>
              
              <Button onClick={startScanning} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Start Scanning
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Position the QR code within the camera view to scan
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  playsInline
                  muted
                />
                {scanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                      <p>Processing...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Button onClick={stopScanning} variant="outline" className="w-full">
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Scanning
              </Button>
              
              <Alert>
                <QrCode className="w-4 h-4" />
                <AlertDescription>
                  Point your camera at the event QR code to mark your attendance
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};