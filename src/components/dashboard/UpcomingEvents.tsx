import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { mockEvents } from '@/constants/dashboardData';

const UpcomingEvents: React.FC = () => {
  return (
    <Card className="border-0 bg-card/40 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">This Week</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockEvents.map((event, index) => (
          <div 
            key={index}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
              event.isActive 
                ? 'bg-gradient-to-r from-primary/5 to-transparent' 
                : ''
            }`}
          >
            <div className={`w-2 h-8 rounded-full transition-colors ${
              event.isActive ? 'bg-primary' : 'bg-muted'
            }`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;