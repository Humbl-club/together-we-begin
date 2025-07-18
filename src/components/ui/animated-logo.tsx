import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  className, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1">
              <animate attributeName="stop-color" 
                values="hsl(var(--primary));hsl(var(--accent));hsl(var(--primary))" 
                dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.8">
              <animate attributeName="stop-color" 
                values="hsl(var(--accent));hsl(var(--primary));hsl(var(--accent))" 
                dur="4s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          
          <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="70%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background Glow */}
        <circle 
          cx="100" 
          cy="100" 
          r="80" 
          fill="url(#glowGradient)"
          opacity="0.5"
        >
          <animate attributeName="r" values="70;90;70" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Outer Ring - Rotating */}
        <circle 
          cx="100" 
          cy="100" 
          r="70" 
          fill="none" 
          stroke="url(#primaryGradient)" 
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity="0.6"
        >
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            values="0 100 100;360 100 100" 
            dur="8s" 
            repeatCount="indefinite" 
          />
        </circle>

        {/* Inner Decorative Elements */}
        <g transform="translate(100,100)">
          {/* Center Artistic Symbol */}
          <g>
            {/* Abstract Feminine Symbol */}
            <path 
              d="M-15,-20 Q0,-35 15,-20 Q20,0 0,20 Q-20,0 -15,-20 Z" 
              fill="url(#primaryGradient)" 
              filter="url(#glow)"
              opacity="0.9"
            >
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                values="0;5;-5;0" 
                dur="4s" 
                repeatCount="indefinite" 
              />
            </path>
            
            {/* Decorative Dots */}
            <circle cx="0" cy="-30" r="2" fill="hsl(var(--primary))">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="25" cy="-10" r="1.5" fill="hsl(var(--accent))">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="-25" cy="-10" r="1.5" fill="hsl(var(--accent))">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
            
            {/* Flowing Lines */}
            <path 
              d="M-30,10 Q-10,25 10,10 Q30,15 40,30" 
              fill="none" 
              stroke="hsl(var(--primary))" 
              strokeWidth="1.5" 
              opacity="0.7"
              strokeDasharray="5 5"
            >
              <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite" />
            </path>
            
            <path 
              d="M30,10 Q10,25 -10,10 Q-30,15 -40,30" 
              fill="none" 
              stroke="hsl(var(--accent))" 
              strokeWidth="1.5" 
              opacity="0.7"
              strokeDasharray="5 5"
            >
              <animate attributeName="stroke-dashoffset" values="10;0" dur="2s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Orbiting Elements */}
          <g>
            <circle cx="40" cy="0" r="3" fill="hsl(var(--primary))" opacity="0.8">
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                values="0;360" 
                dur="6s" 
                repeatCount="indefinite" 
              />
            </circle>
            <circle cx="0" cy="40" r="2" fill="hsl(var(--accent))" opacity="0.6">
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                values="90;450" 
                dur="8s" 
                repeatCount="indefinite" 
              />
            </circle>
            <circle cx="-40" cy="0" r="2.5" fill="hsl(var(--primary))" opacity="0.7">
              <animateTransform 
                attributeName="transform" 
                type="rotate" 
                values="180;540" 
                dur="7s" 
                repeatCount="indefinite" 
              />
            </circle>
          </g>
        </g>

        {/* Outer Decorative Ring */}
        <circle 
          cx="100" 
          cy="100" 
          r="85" 
          fill="none" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="0.5"
          strokeDasharray="1 3"
          opacity="0.3"
        >
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            values="360 100 100;0 100 100" 
            dur="12s" 
            repeatCount="indefinite" 
          />
        </circle>
      </svg>
    </div>
  );
};