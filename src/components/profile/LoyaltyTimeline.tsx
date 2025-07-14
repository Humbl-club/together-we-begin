import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Coins, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useStaggeredAnimation } from '@/hooks/useStaggeredAnimation';

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  description: string | null;
  created_at: string;
  reference_type: string | null;
}

interface LoyaltyTimelineProps {
  transactions: LoyaltyTransaction[];
}

export const LoyaltyTimeline: React.FC<LoyaltyTimelineProps> = ({ transactions }) => {
  const visibleTransactions = useStaggeredAnimation(transactions, 100);

  const getTransactionIcon = (type: string) => {
    return type === 'earned' ? TrendingUp : TrendingDown;
  };

  const getTransactionColor = (type: string) => {
    return type === 'earned' 
      ? 'text-green-600 bg-green-100' 
      : 'text-red-600 bg-red-100';
  };

  return (
    <Card className="profile-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-500" />
          Points Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Coins className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No point activity yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 8).map((transaction, index) => {
              const Icon = getTransactionIcon(transaction.type);
              const colorClass = getTransactionColor(transaction.type);
              
              return (
                <div
                  key={transaction.id}
                  className={`loyalty-item flex items-center gap-4 p-3 rounded-lg border border-border/20 transition-all duration-500 hover:shadow-md ${
                    visibleTransactions[index] 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 80}ms`,
                    background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--background) / 0.9) 100%)'
                  }}
                >
                  <div className={`p-2 rounded-full ${colorClass} transition-transform hover:scale-110`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {transaction.description || `Points ${transaction.type}`}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(transaction.created_at), 'MMM d')}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`font-bold ${
                      transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                    </span>
                    {transaction.reference_type && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {transaction.reference_type}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};