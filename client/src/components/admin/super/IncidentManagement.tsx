import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { AlertTriangle } from 'lucide-react';

export const IncidentManagement: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Incident Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Active Incidents
          </h3>
          <p className="text-gray-600">
            All systems are operating normally.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};