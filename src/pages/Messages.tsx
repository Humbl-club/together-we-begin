import { Layout } from '@/components/layout/Layout';
import { DirectMessaging } from '@/components/messaging/DirectMessaging';
import { MessageCircle } from 'lucide-react';
import { MobileLoading } from '@/components/ui/mobile-loading';
import { useState, useEffect } from 'react';

export default function Messages() {
  const [loading, setLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <MobileLoading 
            variant="skeleton"
            size="lg"
            text="Loading messages..."
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Messages</h1>
              <p className="text-muted-foreground">Connect with your community members</p>
            </div>
          </div>

          <DirectMessaging />
        </div>
      </div>
    </Layout>
  );
}