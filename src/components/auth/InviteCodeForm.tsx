
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Sparkles, Lock } from 'lucide-react';

interface InviteCodeFormProps {
  onValidCode: (inviteCode: string) => void;
}

export const InviteCodeForm: React.FC<InviteCodeFormProps> = ({ onValidCode }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    
    try {
      const { data: invite, error } = await supabase
        .from('invites')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('status', 'pending')
        .single();

      if (error || !invite) {
        toast({
          title: "Invalid invite code",
          description: "Please check your invite code and try again.",
          variant: "destructive"
        });
        return;
      }

      // Check if invite is expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        toast({
          title: "Invite code expired",
          description: "This invite code has expired. Please request a new one.",
          variant: "destructive"
        });
        return;
      }

      onValidCode(code.trim().toUpperCase());
    } catch (error) {
      console.error('Error validating invite:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="editorial-card p-8">
        {/* Floating gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-10 w-24 h-24 bg-secondary/20 rounded-full blur-2xl" />
        </div>

        <div className="text-center mb-8">
          {/* Icon with gradient background */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl" />
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
              <Sparkles className="w-10 h-10" />
            </div>
          </div>

          <h1 className="text-3xl editorial-heading mb-4 text-foreground">
            Welcome to HUMBL
          </h1>
          <p className="text-muted-foreground font-light text-lg">
            Enter your invite code to join our exclusive community of empowered women
          </p>
        </div>

        <form onSubmit={validateInviteCode} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="invite-code" className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Invite Code
            </Label>
            <Input
              id="invite-code"
              name="inviteCode"
              type="text"
              placeholder="ENTER-YOUR-CODE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-12 text-center text-lg tracking-widest font-mono bg-background/50 border-2 focus:border-primary/50"
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <Button 
            type="submit" 
            disabled={!code.trim() || loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 transition-all text-base font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Continue
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Don't have an invite code? Contact our community team for access.
          </p>
        </div>
      </div>
    </div>
  );
};
