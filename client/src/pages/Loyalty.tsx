import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PointsEarningSystem } from '@/components/loyalty/PointsEarningSystem';
import { RewardsStore } from '@/components/loyalty/RewardsStore';
import { PointsManagement } from '@/components/admin/PointsManagement';
import { useAuth } from '@/components/auth/AuthProvider';
import { Trophy, Gift, Settings } from 'lucide-react';

const Loyalty: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">Loyalty Program</h1>
          <p className="text-muted-foreground">
            Earn points through events, challenges, and community engagement
          </p>
        </div>

        <Tabs defaultValue="earning" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="earning" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Earn Points
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Rewards Store
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="earning" className="mt-6">
            <PointsEarningSystem />
          </TabsContent>

          <TabsContent value="rewards" className="mt-6">
            <RewardsStore />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="mt-6">
              <PointsManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Loyalty;