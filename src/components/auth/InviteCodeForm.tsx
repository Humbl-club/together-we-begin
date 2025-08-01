
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Sparkles, Lock, ArrowRight } from 'lucide-react';

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
      <div className="bg-background border border-border rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome to HUMBL
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
              Enter your exclusive invite code to join our inspiring community
            </p>
          </div>
        </div>

        <form onSubmit={validateInviteCode} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="invite-code" className="text-sm font-medium text-foreground text-center block">
              Invite Code
            </Label>
            
            <Input
              id="invite-code"
              name="inviteCode"
              type="text"
              placeholder="ENTER-YOUR-CODE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-12 text-center text-lg tracking-widest font-mono border-border focus:border-primary"
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <Button 
            type="submit" 
            disabled={!code.trim() || loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
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
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Don't have an invite code?
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Contact our community team for exclusive access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
