import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QRCodeScanner } from '@/components/events/QRCodeScanner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Trophy, CheckCircle2, Clock, MapPin, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface AttendanceMarkingWidgetProps {
  eventId?: string;
  showScanner?: boolean;
  compact?: boolean;
}

interface AttendanceRecord {
  id: string;
  event_id: string;
  attended_at: string;
  points_awarded: number;
  events: {
    title: string;
    start_time: string;
    location?: string;
  };
}

export const AttendanceMarkingWidget: React.FC<AttendanceMarkingWidgetProps> = ({
  eventId,
  showScanner = true,
  compact = false
}) => {
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's recent attendance records
  const fetchRecentAttendance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`
          id,
          event_id,
          attended_at,
          points_awarded,
          events!event_id (
            title,
            start_time,
            location
          )
        `)
        .eq('user_id', user.id)
        .order('attended_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentAttendance();
  }, [user]);

  const handleScanSuccess = async (result: string) => {
    setLastScanResult(result);
    setScanning(false);
    
    // Refresh attendance records
    await fetchRecentAttendance();

    // Show success notification with animation
    toast({
      title: '🎉 Attendance Recorded!',
      description: `QR code scanned successfully!`,
    });
  };

  const handleScanError = (error: string) => {
    setScanning(false);
    console.error('Scan error:', error);
  };

  const toggleScanner = () => {
    setScanning(!scanning);
    setLastScanResult(null);
  };

  if (compact) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">Quick Check-in</div>
                <div className="text-sm text-muted-foreground">
                  {recentAttendance.length} events attended
                </div>
              </div>
            </div>
            <Button size="sm" onClick={toggleScanner}>
              {scanning ? 'Close' : 'Scan QR'}
            </Button>
          </div>
          {scanning && (
            <div className="mt-4">
              <QRCodeScanner 
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* QR Scanner */}
      {showScanner && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Event Check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!scanning ? (
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Ready to Check In?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Scan the event QR code to mark your attendance and earn points
                  </p>
                  <Button onClick={toggleScanner} className="w-full">
                    Start QR Scanner
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <QRCodeScanner 
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                />
                <Button variant="outline" onClick={toggleScanner} className="w-full">
                  Cancel Scanning
                </Button>
              </div>
            )}

            {lastScanResult?.success && (
              <Alert className="mt-4">
                <CheckCircle2 className="w-4 h-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Successfully checked in to "{lastScanResult.event_title}"</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +{lastScanResult.points_awarded} points
                  </Badge>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading attendance history...</p>
            </div>
          ) : recentAttendance.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Attendance Records</h3>
              <p className="text-sm text-muted-foreground">
                Start attending events to see your check-in history here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {(record.events as any)?.title || 'Unknown Event'}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(record.attended_at), { addSuffix: true })}
                      </div>
                      {(record.events as any)?.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {(record.events as any).location}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      +{record.points_awarded}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date((record.events as any)?.start_time || record.attended_at), 'MMM d')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};