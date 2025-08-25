import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Coins, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useStaggeredAnimation } from '@/hooks/useStaggeredAnimation';
import { useViewport } from '@/hooks/use-mobile';

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
  const { isMobile } = useViewport();

  const getTransactionIcon = (type: string) => {
    return type === 'earned' ? TrendingUp : TrendingDown;
  };

  const getTransactionColor = (type: string) => {
    return type === 'earned' 
      ? 'text-emerald-600 bg-emerald-500/10 border border-emerald-200/50' 
      : 'text-red-600 bg-red-500/10 border border-red-200/50';
  };

  return (
    <Card className="card-glass border-0 shadow-section">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg lg:text-xl font-semibold">
          <div className="p-2 rounded-full bg-primary/10">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          Points Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 lg:py-12 text-muted-foreground">
            <div className="p-6 rounded-full bg-muted/20 w-fit mx-auto mb-4">
              <Coins className="w-12 h-12 opacity-30" />
            </div>
            <p className="text-base lg:text-lg font-medium">No point activity yet.</p>
            <p className="text-sm text-muted-foreground/70 mt-2">Complete challenges to start earning points!</p>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {transactions.slice(0, isMobile ? 5 : 8).map((transaction, index) => {
              const Icon = getTransactionIcon(transaction.type);
              const colorClass = getTransactionColor(transaction.type);
              
              return (
                <div
                  key={transaction.id}
                  className={`flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl border border-border/20 card-glass transition-all duration-500 hover:shadow-md hover:scale-[1.02] ${
                    visibleTransactions[index] 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 80}ms`,
                  }}
                >
                  <div className={`p-2.5 lg:p-3 rounded-full ${colorClass} transition-transform hover:scale-110 flex-shrink-0`}>
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} text-foreground line-clamp-1`}>
                      {transaction.description || `Points ${transaction.type}`}
                    </p>
                    <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
                      <span className="font-medium">
                        {format(new Date(transaction.created_at), isMobile ? 'MMM d' : 'MMM d, yyyy')}
                      </span>
                      {transaction.reference_type && !isMobile && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 ml-1">
                          {transaction.reference_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 space-y-1">
                    <div className={`font-bold text-lg lg:text-xl ${
                      transaction.type === 'earned' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                    </div>
                    {transaction.reference_type && isMobile && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                        {transaction.reference_type.slice(0, 3)}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
            
            {transactions.length > (isMobile ? 5 : 8) && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {isMobile ? 5 : 8} of {transactions.length} transactions
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};