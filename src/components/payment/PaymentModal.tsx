import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Coins, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    price_cents: number;
    loyalty_points_price?: number;
  };
  userPoints?: number;
}

export function PaymentModal({ isOpen, onClose, event, userPoints = 0 }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "points">("stripe");
  const { toast } = useToast();

  const formatPrice = (cents: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const canUsePoints = event.loyalty_points_price && userPoints >= event.loyalty_points_price;

  const handlePayment = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          eventId: event.id,
          usePoints: paymentMethod === "points"
        }
      });

      if (error) throw error;

      if (paymentMethod === "points") {
        toast({
          title: "Registration Complete!",
          description: "You've successfully registered using loyalty points.",
        });
        onClose();
        window.location.reload();
      } else {
        // Redirect to Stripe checkout
        window.open(data.url, '_blank');
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Complete Registration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <p className="text-muted-foreground">Choose your payment method</p>
          </div>

          <div className="space-y-3">
            {/* Stripe Payment Option */}
            <Card 
              className={`cursor-pointer transition-colors ${
                paymentMethod === "stripe" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setPaymentMethod("stripe")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Credit Card</p>
                      <p className="text-sm text-muted-foreground">Secure payment via Stripe</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{formatPrice(event.price_cents)}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Points Option */}
            {event.loyalty_points_price && (
              <Card 
                className={`cursor-pointer transition-colors ${
                  paymentMethod === "points" ? "ring-2 ring-primary" : ""
                } ${!canUsePoints ? "opacity-50" : ""}`}
                onClick={() => canUsePoints && setPaymentMethod("points")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Coins className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Loyalty Points</p>
                        <p className="text-sm text-muted-foreground">
                          You have {userPoints} points
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={canUsePoints ? "secondary" : "outline"}
                      className={canUsePoints ? "bg-yellow-100 text-yellow-800" : ""}
                    >
                      {event.loyalty_points_price} points
                    </Badge>
                  </div>
                  {!canUsePoints && (
                    <p className="text-xs text-red-500 mt-2">
                      Insufficient points (need {event.loyalty_points_price - userPoints} more)
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              className="flex-1"
              disabled={isProcessing || (paymentMethod === "points" && !canUsePoints)}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {paymentMethod === "points" ? "Use Points" : "Pay Now"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}