
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
      {/* Ultra-Sophisticated Constellation Background */}
      <div className="relative">
        {/* Constellation particle system */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="auth-neural-network" />
          <div className="absolute -top-20 -left-20 w-52 h-52 auth-liquid bg-gradient-conic from-primary/35 via-accent/25 to-secondary/35 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 auth-float bg-gradient-radial from-primary/30 to-transparent rounded-full blur-2xl" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 right-1/4 w-24 h-24 auth-constellation bg-gradient-to-br from-accent/35 to-secondary/25 rounded-full blur-xl" />
          {/* Interconnected nodes */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full auth-constellation"
              style={{
                top: `${15 + Math.random() * 70}%`,
                left: `${15 + Math.random() * 70}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        
        {/* Ultra-Premium Glass Morphism Container */}
        <div className="relative backdrop-blur-3xl bg-gradient-to-br from-background/95 via-background/85 to-card/95 border border-white/30 rounded-3xl p-12 shadow-2xl shadow-primary/15 auth-gesture-responsive">
          {/* Sophisticated particle system */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="auth-glass absolute inset-0 rounded-3xl" />
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute auth-particle"
                style={{
                  width: `${2 + Math.random() * 3}px`,
                  height: `${2 + Math.random() * 3}px`,
                  background: `linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)))`,
                  borderRadius: '50%',
                  top: `${10 + Math.random() * 80}%`,
                  left: `${10 + Math.random() * 80}%`,
                  animationDelay: `${i * 0.4}s`,
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
            {/* Ultra-Premium Invite Code Input */}
            <div className="group space-y-5">
              <Label htmlFor="invite-code" className="text-lg font-bold flex items-center justify-center gap-4 text-foreground/90 group-focus-within:text-primary transition-all">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/25 via-accent/25 to-primary/25 group-focus-within:from-primary/35 group-focus-within:to-accent/35 transition-all shadow-lg auth-security-scan">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-xl">Your Exclusive Invite Code</span>
              </Label>
              
              <div className="relative auth-form-field">
                {/* Advanced input glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/25 via-accent/25 to-primary/25 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                
                {/* Character-by-character reveal animation */}
                <div className="absolute inset-0 auth-field-connect rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-0 group-focus-within:opacity-100" />
                
                <Input
                  id="invite-code"
                  name="inviteCode"
                  type="text"
                  placeholder="••••-••••-••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="auth-magnetic relative h-18 text-center text-2xl tracking-[0.4em] font-mono font-bold bg-gradient-to-br from-background/98 via-card/98 to-background/98 backdrop-blur-2xl border-2 border-border/50 focus:border-primary/80 rounded-2xl shadow-xl transition-all duration-500 focus:shadow-2xl focus:shadow-primary/25 focus:scale-[1.03]"
                  disabled={loading}
                  autoComplete="off"
                />
                
                {/* Biometric-style progress indicator */}
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="h-1 bg-background/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min((code.length / 12) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Character count with security indicator */}
                <div className="absolute top-3 right-4 flex items-center gap-2 text-xs text-muted-foreground/70 font-mono">
                  <div className="w-2 h-2 bg-primary/60 rounded-full auth-trust" />
                  <span>{code.length}/12</span>
                </div>
              </div>
            </div>

            {/* Ultra-Premium Continue Button */}
            <div className="space-y-7">
              <Button 
                type="submit" 
                disabled={!code.trim() || loading}
                className="auth-magnetic relative w-full h-20 bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/95 hover:via-accent/95 hover:to-primary/95 text-primary-foreground font-bold text-xl rounded-2xl transition-all duration-600 hover:shadow-2xl hover:shadow-primary/35 group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Advanced button aurora effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 transition-all duration-500" 
                     style={{ animation: loading ? 'none' : 'auth-glass 3s ease-in-out infinite' }} />
                
                {/* Button depth layers */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl" />
                
                {loading ? (
                  <>
                    <Loader2 className="w-7 h-7 mr-4 animate-spin" />
                    <span className="text-lg tracking-wide">Authenticating Access...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-7 h-7 mr-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="text-lg tracking-wide">Begin Your Journey</span>
                    <ArrowRight className="w-7 h-7 ml-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </Button>
              
              {/* Biometric-Style Trust Indicators */}
              <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2 auth-trust">
                  <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50" />
                  <span className="tracking-wide">Quantum Secure</span>
                </div>
                <div className="flex items-center gap-2 auth-trust" style={{ animationDelay: '0.7s' }}>
                  <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50" />
                  <span className="tracking-wide">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center gap-2 auth-trust" style={{ animationDelay: '1.4s' }}>
                  <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50" />
                  <span className="tracking-wide">Zero-Knowledge</span>
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
