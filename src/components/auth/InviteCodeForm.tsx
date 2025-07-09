
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
    <div className="floating-card max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Welcome to HUMBL
        </h1>
        <p className="text-muted-foreground">
          Enter your invite code to join our exclusive community
        </p>
      </div>

      <form onSubmit={validateInviteCode} className="space-y-4">
        <div>
          <Label htmlFor="invite-code">Invite Code</Label>
          <Input
            id="invite-code"
            type="text"
            placeholder="Enter your invite code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="mt-1 text-center text-lg tracking-widest font-mono"
            disabled={loading}
          />
        </div>

        <Button 
          type="submit" 
          disabled={!code.trim() || loading}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </form>
    </div>
  );
};
