import { Layout } from '@/components/layout/Layout';
import { OptimizedMessaging } from '@/components/messaging/OptimizedMessaging';
import { MessageCircle } from 'lucide-react';

export default function Messages() {
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

          <OptimizedMessaging />
        </div>
      </div>
    </Layout>
  );
}