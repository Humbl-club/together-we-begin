import { Layout } from '@/components/layout/Layout';
import { DirectMessaging } from '@/components/messaging/DirectMessaging';
import { MessageErrorBoundary } from '@/components/messaging/MessageErrorBoundary';
import { MessageCircle } from 'lucide-react';
import { MobileLoading } from '@/components/ui/mobile-loading';
import { useState, useEffect } from 'react';
import { SEO } from '@/components/seo/SEO';

export default function Messages() {

  return (
    <Layout>
      <SEO title="Private Messages" description="Secure, end-to-end encrypted messages with your community." canonical="/messages" />
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Messages</h1>
              <p className="text-muted-foreground">Connect with your community members</p>
            </div>
          </div>

          <MessageErrorBoundary>
            <DirectMessaging />
          </MessageErrorBoundary>
        </div>
      </div>
    </Layout>
  );
}