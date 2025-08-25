import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeGenerator } from './QRCodeGenerator';
import { Users, Trophy, Calendar, QrCode, Download } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  user_id: string;
  attended_at: string;
  points_awarded: number;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

interface AttendanceManagerProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  attendancePoints?: number;
  qrCodeToken?: string;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  eventId,
  eventTitle,
  eventDate,
  attendancePoints = 0,
  qrCodeToken
}) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQRToken, setCurrentQRToken] = useState(qrCodeToken);
  const { toast } = useToast();

  useEffect(() => {
    loadAttendance();
  }, [eventId]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      
      // First get attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('event_attendance')
        .select('id, user_id, attended_at, points_awarded')
        .eq('event_id', eventId)
        .order('attended_at', { ascending: false });

      if (attendanceError) {
        throw attendanceError;
      }

      // Then get profile data for each user
      if (attendanceData && attendanceData.length > 0) {
        const userIds = attendanceData.map(record => record.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          throw profilesError;
        }

        // Combine the data
        const combinedData = attendanceData.map(attendance => ({
          ...attendance,
          profiles: profilesData?.find(profile => profile.id === attendance.user_id) || null
        }));

        setAttendance(combinedData);
      } else {
        setAttendance([]);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance records',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRGenerated = (token: string) => {
    setCurrentQRToken(token);
    // Optionally refresh attendance data
    loadAttendance();
  };

  const exportAttendance = () => {
    if (attendance.length === 0) {
      toast({
        title: 'No Data',
        description: 'No attendance records to export',
        variant: 'destructive'
      });
      return;
    }

    const csvData = [
      ['Name', 'Attended At', 'Points Awarded'],
      ...attendance.map(record => [
        record.profiles?.full_name || 'Unknown',
        format(new Date(record.attended_at), 'yyyy-MM-dd HH:mm:ss'),
        record.points_awarded.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attendance.csv`;
    link.click();
    
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: 'Attendance data exported successfully',
    });
  };

  const totalPointsAwarded = attendance.reduce((sum, record) => sum + record.points_awarded, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Attendance Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{attendance.length}</div>
                  <div className="text-sm text-muted-foreground">Total Attendees</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{totalPointsAwarded}</div>
                  <div className="text-sm text-muted-foreground">Points Awarded</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <QrCode className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{currentQRToken ? 'Active' : 'None'}</div>
                  <div className="text-sm text-muted-foreground">QR Code Status</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={exportAttendance} 
              variant="outline" 
              disabled={attendance.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="qr-code" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qr-code">QR Code</TabsTrigger>
          <TabsTrigger value="attendance">Attendance List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="qr-code" className="space-y-4">
          <QRCodeGenerator
            eventId={eventId}
            eventTitle={eventTitle}
            existingQRToken={currentQRToken}
            onQRGenerated={handleQRGenerated}
          />
        </TabsContent>
        
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p>Loading attendance records...</p>
                </div>
              ) : attendance.length === 0 ? (
                <Alert>
                  <Users className="w-4 h-4" />
                  <AlertDescription>
                    No attendance records yet. Generate a QR code to start tracking attendance.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {attendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {record.profiles?.full_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(record.attended_at), 'MMM dd, yyyy at HH:mm')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {record.points_awarded > 0 && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            +{record.points_awarded}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};