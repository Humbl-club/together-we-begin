import React from 'react';
import { QRCodeScanner } from '@/components/events/QRCodeScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QRScannerPage: React.FC = () => {
  const navigate = useNavigate();

  const handleScanSuccess = (result: any) => {
    console.log('Scan successful:', result);
    // Optionally navigate to events page or show success message
    setTimeout(() => {
      navigate('/events');
    }, 3000);
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Scan Event QR Code</h1>
        </div>

        {/* Instructions */}
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Position your camera over the event QR code to mark your attendance and earn points.
          </AlertDescription>
        </Alert>

        {/* QR Scanner */}
        <QRCodeScanner
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
        />

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="w-5 h-5" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <p className="text-sm">Find the QR code displayed at the event location</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <p className="text-sm">Point your camera at the QR code</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <p className="text-sm">Wait for the scan to complete and earn your attendance points!</p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/events')}
          >
            Back to Events
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;