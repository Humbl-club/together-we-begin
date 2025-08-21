import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface StepHistoryChartProps {
  data: { date: string; steps: number }[];
  className?: string;
}

export const StepHistoryChart: React.FC<StepHistoryChartProps> = ({ 
  data, 
  className 
}) => {
  const chartData = data.map(entry => ({
    ...entry,
    dayName: new Date(entry.date).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }));

  const maxSteps = Math.max(...data.map(d => d.steps));
  const avgSteps = Math.round(data.reduce((sum, d) => sum + d.steps, 0) / data.length);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Step History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Daily Average</p>
            <p className="font-semibold">{avgSteps.toLocaleString()} steps</p>
          </div>
          <div>
            <p className="text-muted-foreground">Best Day</p>
            <p className="font-semibold">{maxSteps.toLocaleString()} steps</p>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dayName" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [value.toLocaleString(), 'Steps']}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)'
                }}
              />
              <Bar 
                dataKey="steps" 
                fill="hsl(var(--primary))"
                radius={4}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};