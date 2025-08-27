import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Construction } from 'lucide-react';

const BrandingCustomization: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="w-5 h-5" />
          Branding Customization
        </CardTitle>
        <CardDescription>
          Customize your organization's visual identity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <Construction className="w-4 h-4" />
          <AlertDescription>
            <strong>Feature Under Development</strong>
            <p className="mt-1">
              Custom branding features are being implemented as part of the multi-tenant system.
              This will include theme customization, logo uploads, and typography settings.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default BrandingCustomization;