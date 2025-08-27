import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield, AlertCircle } from 'lucide-react';

export const ContentModerationDashboard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Content Moderation Dashboard
        </CardTitle>
        <CardDescription>
          Monitor and moderate user-generated content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>Moderation System Pending Setup</strong>
            <p className="mt-1">
              The content moderation system requires database tables to be created.
              Features will include content reporting, user warnings, and ban management.
            </p>
          </AlertDescription>
        </Alert>
        
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Issued this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Bans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Active bans</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentModerationDashboard;