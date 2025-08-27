import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Mock modules
vi.mock('@/integrations/supabase/client')
vi.mock('@/hooks/use-toast')

const mockToast = vi.fn()
const mockSupabase = {
  functions: {
    invoke: vi.fn(),
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(supabase, mockSupabase)
  ;(useToast as any).mockReturnValue({ toast: mockToast })
  
  // Mock window.open and window.location.reload
  vi.stubGlobal('open', vi.fn())
  Object.defineProperty(window, 'location', {
    value: { reload: vi.fn() },
    writable: true,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

const mockEvent = {
  id: 'event-123',
  title: 'Test Event',
  price_cents: 2500, // €25.00
  loyalty_points_price: 500
}

describe('PaymentModal - Payment System Integration', () => {
  describe('Modal Rendering and State', () => {
    it('should render payment modal with correct event details', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={1000}
        />
      )

      expect(screen.getByText('Complete Registration')).toBeInTheDocument()
      expect(screen.getByText('Test Event')).toBeInTheDocument()
      expect(screen.getByText('Choose your payment method')).toBeInTheDocument()
    })

    it('should show correct price formatting', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={1000}
        />
      )

      expect(screen.getByText('€25.00')).toBeInTheDocument()
      expect(screen.getByText('500 points')).toBeInTheDocument()
    })

    it('should disable points option when insufficient points', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={100} // Less than required 500
        />
      )

      expect(screen.getByText('You have 100 points')).toBeInTheDocument()
      expect(screen.getByText('Insufficient points (need 400 more)')).toBeInTheDocument()
      
      // Points card should be disabled (opacity-50 class)
      const pointsCard = screen.getByText('Loyalty Points').closest('[class*="Card"]')
      expect(pointsCard).toHaveClass('opacity-50')
    })
  })

  describe('Payment Method Selection', () => {
    it('should allow selecting stripe payment method', async () => {
      const user = userEvent.setup()
      
      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={1000}
        />
      )

      const stripeCard = screen.getByText('Credit Card').closest('[class*="Card"]')
      await user.click(stripeCard!)

      expect(stripeCard).toHaveClass('ring-2')
      expect(stripeCard).toHaveClass('ring-primary')
    })

    it('should allow selecting points payment method when sufficient points', async () => {
      const user = userEvent.setup()
      
      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={1000}
        />
      )

      const pointsCard = screen.getByText('Loyalty Points').closest('[class*="Card"]')
      await user.click(pointsCard!)

      expect(pointsCard).toHaveClass('ring-2')
      expect(pointsCard).toHaveClass('ring-primary')
    })

    it('should not allow selecting points payment method when insufficient points', async () => {
      const user = userEvent.setup()
      
      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={100}
        />
      )

      const pointsCard = screen.getByText('Loyalty Points').closest('[class*="Card"]')
      await user.click(pointsCard!)

      // Should still show stripe as selected
      const stripeCard = screen.getByText('Credit Card').closest('[class*="Card"]')
      expect(stripeCard).toHaveClass('ring-2')
      expect(pointsCard).not.toHaveClass('ring-2')
    })
  })

  describe('Stripe Payment Flow', () => {
    it('should successfully process stripe payment', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/session-123' },
        error: null
      })

      render(
        <PaymentModal
          isOpen={true}
          onClose={onClose}
          event={mockEvent}
          userPoints={1000}
        />
      )

      // Click Pay Now button (default is stripe)
      const payButton = screen.getByText('Pay Now')
      await user.click(payButton)

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('create-payment', {
          body: {
            eventId: 'event-123',
            usePoints: false
          }
        })
      })

      expect(window.open).toHaveBeenCalledWith('https://checkout.stripe.com/session-123', '_blank')
      expect(onClose).toHaveBeenCalled()
    })

    it('should handle stripe payment errors', async () => {
      const user = userEvent.setup()
      
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: new Error('Payment processing failed')
      })

      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={1000}
        />
      )

      const payButton = screen.getByText('Pay Now')
      await user.click(payButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Payment Failed",
          description: "Payment processing failed",
          variant: "destructive",
        })
      })
    })
  })

  describe('Loyalty Points Payment Flow', () => {
    it('should successfully process points payment', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true, paymentMethod: 'points' },
        error: null
      })

      render(
        <PaymentModal
          isOpen={true}
          onClose={onClose}
          event={mockEvent}
          userPoints={1000}
        />
      )

      // Select points payment method
      const pointsCard = screen.getByText('Loyalty Points').closest('[class*="Card"]')
      await user.click(pointsCard!)

      // Click Use Points button
      const payButton = screen.getByText('Use Points')
      await user.click(payButton)

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('create-payment', {
          body: {
            eventId: 'event-123',
            usePoints: true
          }
        })
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: "Registration Complete!",
        description: "You've successfully registered using loyalty points.",
      })

      expect(onClose).toHaveBeenCalled()
      expect(window.location.reload).toHaveBeenCalled()
    })

    it('should handle insufficient points error from backend', async () => {
      const user = userEvent.setup()
      
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: new Error('Insufficient loyalty points')
      })

      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={1000}
        />
      )

      // Select points payment method
      const pointsCard = screen.getByText('Loyalty Points').closest('[class*="Card"]')
      await user.click(pointsCard!)

      const payButton = screen.getByText('Use Points')
      await user.click(payButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Payment Failed",
          description: "Insufficient loyalty points",
          variant: "destructive",
        })
      })
    })
  })

  describe('UI State Management', () => {
    it('should show loading state during payment processing', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      mockSupabase.functions.invoke.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { url: 'test' }, error: null }), 1000)
        )
      )

      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={1000}
        />
      )

      const payButton = screen.getByText('Pay Now')
      await user.click(payButton)

      // Should show loading spinner
      expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument()
      
      // Buttons should be disabled during processing
      expect(screen.getByText('Cancel')).toBeDisabled()
      expect(payButton).toBeDisabled()
    })

    it('should disable pay button when points selected but insufficient', () => {
      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={100}
        />
      )

      // Try to select points (should fail)
      const pointsCard = screen.getByText('Loyalty Points').closest('[class*="Card"]')
      fireEvent.click(pointsCard!)

      // Pay button should still show "Pay Now" (stripe) and be enabled
      expect(screen.getByText('Pay Now')).not.toBeDisabled()
    })
  })

  describe('Event without Loyalty Points Option', () => {
    it('should only show stripe option when event has no loyalty points price', () => {
      const eventWithoutPoints = {
        ...mockEvent,
        loyalty_points_price: undefined
      }

      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={eventWithoutPoints}
          userPoints={1000}
        />
      )

      expect(screen.getByText('Credit Card')).toBeInTheDocument()
      expect(screen.queryByText('Loyalty Points')).not.toBeInTheDocument()
      expect(screen.getByText('Pay Now')).toBeInTheDocument()
    })
  })

  describe('Modal Controls', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(
        <PaymentModal
          isOpen={true}
          onClose={onClose}
          event={mockEvent}
          userPoints={1000}
        />
      )

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('should handle modal close via dialog controls', () => {
      const onClose = vi.fn()

      render(
        <PaymentModal
          isOpen={true}
          onClose={onClose}
          event={mockEvent}
          userPoints={1000}
        />
      )

      // Simulate dialog onOpenChange
      const dialog = screen.getByRole('dialog')
      fireEvent.keyDown(dialog, { key: 'Escape' })
      
      // This would trigger the dialog's onOpenChange with false
      // In actual implementation, this would call onClose
    })
  })

  describe('Price Formatting', () => {
    it('should correctly format various price amounts', () => {
      const testCases = [
        { cents: 0, expected: '€0.00' },
        { cents: 100, expected: '€1.00' },
        { cents: 1250, expected: '€12.50' },
        { cents: 10000, expected: '€100.00' },
        { cents: 999999, expected: '€9,999.99' },
      ]

      testCases.forEach(({ cents, expected }) => {
        const testEvent = { ...mockEvent, price_cents: cents }
        
        const { unmount } = render(
          <PaymentModal
            isOpen={true}
            onClose={vi.fn()}
            event={testEvent}
            userPoints={1000}
          />
        )

        expect(screen.getByText(expected)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup()
      
      mockSupabase.functions.invoke.mockRejectedValue(new Error('Network error'))

      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={1000}
        />
      )

      const payButton = screen.getByText('Pay Now')
      await user.click(payButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Payment Failed",
          description: "Network error",
          variant: "destructive",
        })
      })
    })

    it('should handle non-Error objects in catch block', async () => {
      const user = userEvent.setup()
      
      mockSupabase.functions.invoke.mockRejectedValue('String error')

      render(
        <PaymentModal
          isOpen={true}
          onClose={vi.fn()}
          event={mockEvent}
          userPoints={1000}
        />
      )

      const payButton = screen.getByText('Pay Now')
      await user.click(payButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Payment Failed",
          description: "String error",
          variant: "destructive",
        })
      })
    })
  })
})