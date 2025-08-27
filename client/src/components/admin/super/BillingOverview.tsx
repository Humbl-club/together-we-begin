import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { DollarSign } from 'lucide-react';

export const BillingOverview: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Billing Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Billing Management
          </h3>
          <p className="text-gray-600">
            Platform-wide billing and subscription management interface coming soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};