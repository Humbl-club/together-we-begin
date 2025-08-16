import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Star, Gift, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttendanceNotificationProps {
  onClose?: () => void;
}

interface RecentAttendance {
  id: string;
  event_title: string;
  points_awarded: number;
  attended_at: string;
  badge_earned?: string;
}

export const AttendanceNotification: React.FC<AttendanceNotificationProps> = ({
  onClose
}) => {
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to new attendance records
    const channel = supabase
      .channel('attendance-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_attendance',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        // Fetch event details for the new attendance record
        const { data: eventData } = await supabase
          .from('events')
          .select('title')
          .eq('id', payload.new.event_id)
          .single();

        if (eventData) {
          const attendanceData: RecentAttendance = {
            id: payload.new.id,
            event_title: eventData.title,
            points_awarded: payload.new.points_awarded || 0,
            attended_at: payload.new.attended_at,
            badge_earned: undefined // Could be enhanced to check for badges
          };

          setRecentAttendance(attendanceData);
          setShowNotification(true);

          // Auto-hide after 8 seconds
          setTimeout(() => {
            setShowNotification(false);
          }, 8000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleClose = () => {
    setShowNotification(false);
    onClose?.();
  };

  if (!recentAttendance || !showNotification) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30,
          duration: 0.4
        }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <Card className="glass-card border-2 border-primary/20 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center"
              >
                <Trophy className="w-6 h-6 text-white" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-semibold text-sm mb-1">
                    🎉 Attendance Recorded!
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 truncate">
                    {recentAttendance.event_title}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        +{recentAttendance.points_awarded} points
                      </Badge>
                    </motion.div>
                    
                    {recentAttendance.badge_earned && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.7, type: "spring" }}
                      >
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                          <Gift className="w-3 h-3 mr-1" />
                          Badge Earned!
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="mt-3 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full origin-left"
            />
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};