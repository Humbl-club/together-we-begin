import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('renders with text', () => {
    const { getByRole } = render(<Button>Click me</Button>);
    expect(getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    const { getByRole } = render(<Button onClick={handleClick}>Click</Button>);
    
    const button = getByRole('button', { name: 'Click' });
    button.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    
    const button = getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    const { getByRole, rerender } = render(<Button variant="default">Default</Button>);
    expect(getByRole('button')).toHaveClass('card-accent');
    
    rerender(<Button variant="destructive">Destructive</Button>);
    expect(getByRole('button')).toHaveClass('bg-destructive');
    
    rerender(<Button variant="outline">Outline</Button>);
    expect(getByRole('button')).toHaveClass('button-glass');
  });

  it('applies size classes correctly', () => {
    const { getByRole, rerender } = render(<Button size="default">Default</Button>);
    expect(getByRole('button')).toHaveClass('h-10', 'px-4', 'py-2');
    
    rerender(<Button size="sm">Small</Button>);
    expect(getByRole('button')).toHaveClass('h-9', 'px-3');
    
    rerender(<Button size="lg">Large</Button>);
    expect(getByRole('button')).toHaveClass('h-12', 'px-8');
  });
});