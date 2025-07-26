import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QRCodeGeneratorProps {
  eventId: string;
  eventTitle: string;
  existingQRToken?: string;
  onQRGenerated?: (token: string) => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  eventId,
  eventTitle,
  existingQRToken,
  onQRGenerated
}) => {
  const [qrDataURL, setQrDataURL] = useState<string>('');
  const [attendancePoints, setAttendancePoints] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [qrToken, setQrToken] = useState<string>(existingQRToken || '');
  const { toast } = useToast();

  // Generate QR code image when token changes
  useEffect(() => {
    if (qrToken) {
      generateQRImage(qrToken);
    }
  }, [qrToken]);

  const generateQRImage = async (token: string) => {
    try {
      // Create QR code data URL with the token
      const qrDataURL = await QRCode.toDataURL(token, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256
      });
      
      setQrDataURL(qrDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code image',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    
    try {
      // First update the event with attendance points
      const { error: updateError } = await supabase
        .from('events')
        .update({ attendance_points: attendancePoints })
        .eq('id', eventId);

      if (updateError) {
        throw updateError;
      }

      // Generate QR code using the database function
      const { data, error } = await supabase.rpc('generate_event_qr_code', {
        event_id_param: eventId
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; qr_token?: string; error?: string };
      
      if (result?.success && result.qr_token) {
        setQrToken(result.qr_token);
        onQRGenerated?.(result.qr_token);
        
        toast({
          title: 'Success',
          description: 'QR code generated successfully!',
        });
      } else {
        throw new Error(result?.error || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate QR code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataURL) return;
    
    const link = document.createElement('a');
    link.download = `event-qr-${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    link.href = qrDataURL;
    link.click();
  };

  const copyQRToken = async () => {
    if (!qrToken) return;
    
    try {
      await navigator.clipboard.writeText(qrToken);
      toast({
        title: 'Copied!',
        description: 'QR token copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy QR token',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code for Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!qrToken ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="attendance-points">Attendance Points</Label>
              <Input
                id="attendance-points"
                type="number"
                min="0"
                max="1000"
                value={attendancePoints}
                onChange={(e) => setAttendancePoints(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Points to award for attendance"
              />
              <p className="text-sm text-muted-foreground">
                Points users will receive when they scan the QR code
              </p>
            </div>

            <Button 
              onClick={handleGenerateQR} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="w-4 h-4" />
              <AlertDescription>
                QR code generated! Users can scan this to mark attendance and earn {attendancePoints} points.
              </AlertDescription>
            </Alert>

            {qrDataURL && (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <OptimizedImage 
                    src={qrDataURL} 
                    alt="Event QR Code" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                
                <div className="space-y-2">
                  <Button onClick={downloadQRCode} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                  
                  <Button onClick={copyQRToken} variant="outline" className="w-full">
                    Copy QR Token
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground break-all">
                  Token: {qrToken}
                </div>
              </div>
            )}

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Print this QR code and display it at your event location. Attendees can scan it to mark their attendance.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};