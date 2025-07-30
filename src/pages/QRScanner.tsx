import React from 'react';
import { AttendanceMarkingWidget } from '@/components/events/AttendanceMarkingWidget';
import { AttendanceNotification } from '@/components/notifications/AttendanceNotification';
import { Layout } from '@/components/layout/Layout';

const QRScanner: React.FC = () => {
  return (
    <Layout>
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold gradient-text">Event Check-in</h1>
          <p className="text-muted-foreground">
            Scan QR codes to mark your attendance and earn points
          </p>
        </div>
        
        <AttendanceMarkingWidget />
        <AttendanceNotification />
      </div>
    </Layout>
  );
};

export default QRScanner;