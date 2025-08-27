import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Construction, Palette } from 'lucide-react';

const BrandingCustomizationPlaceholder: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Palette className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Branding Customization</h2>
          <p className="text-muted-foreground">
            Customize your organization's visual identity
          </p>
        </div>
      </div>

      <Alert>
        <Construction className="h-4 w-4" />
        <AlertDescription>
          <strong>Feature Coming Soon</strong>
          <br />
          Custom branding features are currently under development. 
          You can customize your organization settings through the basic settings panel for now.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Custom color schemes and branding will be available in a future update.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="h-4 w-4" />
              Logo Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Custom logo upload functionality coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrandingCustomizationPlaceholder;