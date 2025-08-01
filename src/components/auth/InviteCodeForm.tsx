
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
    <div className="w-full max-w-lg mx-auto">
      {/* Cosmic Background Effects */}
      <div className="relative">
        {/* Dynamic floating orbs */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-gradient-conic from-primary/40 via-accent/30 to-secondary/40 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-gradient-radial from-primary/30 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-gradient-to-br from-accent/40 to-secondary/30 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '1s' }} />
        </div>
        
        {/* Ultra-modern glass container */}
        <div className="relative backdrop-blur-2xl bg-gradient-to-br from-background/90 via-background/80 to-card/90 border border-white/20 rounded-3xl p-10 shadow-2xl shadow-primary/10">
          {/* Animated sparkle effects */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary/60 rounded-full animate-ping"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>

          <div className="text-center mb-12">
            {/* Revolutionary icon design */}
            <div className="relative mb-10">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 w-32 h-32 mx-auto">
                <div className="w-full h-full border-2 border-dashed border-primary/30 rounded-full animate-spin" style={{ animationDuration: '12s' }} />
              </div>
              
              {/* Middle pulsing ring */}
              <div className="absolute inset-2 w-28 h-28 mx-auto">
                <div className="w-full h-full border border-accent/40 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
              </div>
              
              {/* Cosmic glow */}
              <div className="absolute inset-0 w-32 h-32 mx-auto">
                <div className="w-full h-full bg-gradient-conic from-primary/30 via-accent/20 to-primary/30 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
              </div>
              
              {/* Central icon */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-background/95 via-card/90 to-background/95 backdrop-blur-xl border-2 border-white/30 shadow-2xl">
                <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20">
                  <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                </div>
              </div>
            </div>

            {/* Premium typography */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
                  Welcome to
                </h1>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
                  HUMBL
                </h1>
              </div>
              
              {/* Animated divider */}
              <div className="flex items-center justify-center space-x-2">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/50" />
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
                <div className="h-px w-16 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50" />
                <div className="w-2 h-2 bg-accent/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/50" />
              </div>
              
              <p className="text-muted-foreground font-light text-xl leading-relaxed max-w-md mx-auto">
                Enter your exclusive invite code to join our inspiring community of empowered women
              </p>
            </div>
          </div>

          <form onSubmit={validateInviteCode} className="space-y-10">
            {/* Premium invite code input */}
            <div className="group space-y-4">
              <Label htmlFor="invite-code" className="text-base font-bold flex items-center justify-center gap-3 text-foreground/90 group-focus-within:text-primary transition-all">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 group-focus-within:from-primary/30 group-focus-within:to-accent/30 transition-all shadow-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-lg">Your Exclusive Invite Code</span>
              </Label>
              
              <div className="relative">
                {/* Input glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
                
                <Input
                  id="invite-code"
                  name="inviteCode"
                  type="text"
                  placeholder="ENTER-YOUR-CODE"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="relative h-16 text-center text-xl tracking-[0.3em] font-mono font-bold bg-gradient-to-br from-background/95 via-card/95 to-background/95 backdrop-blur-xl border-2 border-border/50 focus:border-primary/70 rounded-2xl shadow-lg transition-all duration-300 focus:shadow-xl focus:shadow-primary/20 focus:scale-[1.02]"
                  disabled={loading}
                  autoComplete="off"
                />
                
                {/* Character limit indicator */}
                <div className="absolute bottom-2 right-4 text-xs text-muted-foreground/60 font-mono">
                  {code.length}/12
                </div>
              </div>
            </div>

            {/* Ultra-premium continue button */}
            <div className="space-y-6">
              <Button 
                type="submit" 
                disabled={!code.trim() || loading}
                className="relative w-full h-18 bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90 text-primary-foreground font-bold text-lg rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Button shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all" />
                
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    <span className="animate-pulse">Validating Your Access...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                    <span>Begin Your Journey</span>
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              
              {/* Trust indicators */}
              <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <span>Encrypted</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                  <span>Private</span>
                </div>
              </div>
            </div>
          </form>

          <div className="mt-12 text-center">
            <div className="backdrop-blur-lg bg-gradient-to-br from-muted/40 to-card/40 border border-border/30 rounded-2xl p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4 text-primary/70" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Don't have an invite code yet?
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  Contact our community team for exclusive access to join this empowering space.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
