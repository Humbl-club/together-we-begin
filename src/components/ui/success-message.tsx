import React from 'react';
import { CheckCircle, Sparkles, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SuccessMessageProps {
  title: string;
  description: string;
  improvements: string[];
  className?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title,
  description,
  improvements,
  className
}) => {
  return (
    <Card className={`glass-card border-green-500 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          {title}
        </CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {improvements.map((improvement, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">{improvement}</span>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 flex-wrap pt-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Polished
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Optimized
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Production Ready
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};