import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-atelier-hero p-4">
      <Card className="editorial-card max-w-md w-full text-center">
        <CardContent className="p-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-editorial-sage rounded-xl flex items-center justify-center">
            <Home className="w-8 h-8 text-editorial-charcoal" />
          </div>
          <h1 className="text-2xl editorial-heading mb-4 text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground mb-6 font-light leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;