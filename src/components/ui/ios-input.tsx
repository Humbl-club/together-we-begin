import React, { memo, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useAdvancedMobileOptimization } from '@/hooks/useAdvancedMobileOptimization';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface IOSInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'rounded' | 'floating';
  icon?: React.ReactNode;
}

export const IOSInput = memo(forwardRef<HTMLInputElement, IOSInputProps>(
  ({ className, label, error, helperText, variant = 'default', icon, onFocus, onBlur, ...props }, ref) => {
    const { isMobile } = useAdvancedMobileOptimization();
    const haptic = useHapticFeedback();
    const [focused, setFocused] = React.useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      if (isMobile) haptic.selection();
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    };

    const inputClasses = {
      default: cn(
        'w-full px-4 py-3 bg-background border border-border rounded-xl',
        'font-size-16 transition-all duration-200',
        'focus:border-primary focus:ring-2 focus:ring-primary/20',
        error && 'border-destructive focus:border-destructive focus:ring-destructive/20'
      ),
      rounded: cn(
        'w-full px-4 py-3 bg-muted/50 border-0 rounded-2xl',
        'font-size-16 transition-all duration-200',
        'focus:bg-background focus:ring-2 focus:ring-primary/30',
        error && 'bg-destructive/10 focus:ring-destructive/20'
      ),
      floating: cn(
        'w-full px-4 pt-6 pb-2 bg-muted/30 border border-border rounded-xl',
        'font-size-16 transition-all duration-200',
        'focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20',
        error && 'border-destructive focus:border-destructive focus:ring-destructive/20'
      )
    };

    return (
      <div className="space-y-2">
        {label && variant !== 'floating' && (
          <label className={cn(
            'block text-sm font-medium text-foreground',
            error && 'text-destructive'
          )}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              inputClasses[variant],
              icon && 'pl-10',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              fontSize: isMobile ? '16px' : undefined, // Prevent zoom on iOS
            }}
            {...props}
          />
          
          {variant === 'floating' && label && (
            <label className={cn(
              'absolute left-4 transition-all duration-200 pointer-events-none',
              'text-muted-foreground origin-left',
              focused || props.value 
                ? 'top-2 text-xs scale-75' 
                : 'top-1/2 -translate-y-1/2 text-base',
              error && 'text-destructive',
              focused && 'text-primary'
            )}>
              {label}
            </label>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={cn(
            'text-xs',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
));

interface IOSTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
}

export const IOSTextarea = memo(forwardRef<HTMLTextAreaElement, IOSTextareaProps>(
  ({ className, label, error, helperText, autoResize = false, onChange, ...props }, ref) => {
    const { isMobile } = useAdvancedMobileOptimization();
    const haptic = useHapticFeedback();
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(ref, () => textareaRef.current!);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
      onChange?.(e);
    };

    const handleFocus = () => {
      if (isMobile) haptic.selection();
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className={cn(
            'block text-sm font-medium text-foreground',
            error && 'text-destructive'
          )}>
            {label}
          </label>
        )}
        
        <textarea
          ref={textareaRef}
          className={cn(
            'w-full px-4 py-3 bg-background border border-border rounded-xl',
            'font-size-16 transition-all duration-200 resize-none',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'min-h-[100px]',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className
          )}
          onChange={handleChange}
          onFocus={handleFocus}
          style={{
            fontSize: isMobile ? '16px' : undefined, // Prevent zoom on iOS
          }}
          {...props}
        />
        
        {(error || helperText) && (
          <p className={cn(
            'text-xs',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
));

IOSInput.displayName = 'IOSInput';
IOSTextarea.displayName = 'IOSTextarea';