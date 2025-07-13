import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { mockEvents } from '@/constants/dashboardData';

const UpcomingEvents: React.FC = () => {
  return (
    <Card className="editorial-card">
      <CardHeader className="pb-3">
        <div className="cluster justify-between">
          <CardTitle className="fluid-subheading font-medium">This Week</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary modern-button focus-ring">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flow-content">
        {mockEvents.map((event, index) => (
          <div 
            key={index}
            className={`cluster p-3 rounded-lg transition-all duration-200 hover-scale ${
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