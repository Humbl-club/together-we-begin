import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MobileStatsRingProps {
  value: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  className?: string;
  animated?: boolean;
  showPercentage?: boolean;
}

export const MobileStatsRing: React.FC<MobileStatsRingProps> = ({
  value,
  max,
  size = 'md',
  thickness = 4,
  color = 'hsl(var(--primary))',
  backgroundColor = 'hsl(var(--muted))',
  children,
  className,
  animated = true,
  showPercentage = false
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  const percentage = Math.min((value / max) * 100, 100);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedValue(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(percentage);
    }
  }, [percentage, animated]);

  const sizes = {
    sm: { width: 60, height: 60, strokeWidth: 3 },
    md: { width: 80, height: 80, strokeWidth: 4 },
    lg: { width: 120, height: 120, strokeWidth: 6 }
  };

  const { width, height, strokeWidth } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / 100) * circumference;

  return (
    <div 
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width, height }}
    >
      <svg
        className="transform -rotate-90"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-20"
        />
        
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-1000 ease-out",
            animated && "animate-[draw-circle_1s_ease-out]"
          )}
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`
          }}
        />
      </svg>
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <span className={cn(
            "font-bold text-center",
            size === 'sm' && "text-xs",
            size === 'md' && "text-sm",
            size === 'lg' && "text-base"
          )}>
            {Math.round(percentage)}%
          </span>
        ))}
      </div>
    </div>
  );
};