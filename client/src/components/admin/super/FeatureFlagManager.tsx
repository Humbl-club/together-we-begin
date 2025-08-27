import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Flag } from 'lucide-react';

export const FeatureFlagManager: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-5 h-5" />
          Feature Flags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Feature Flag Management
          </h3>
          <p className="text-gray-600">
            Control feature rollouts and A/B testing across all organizations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};