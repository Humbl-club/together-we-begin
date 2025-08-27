import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Building, Users, CheckCircle } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { orgSupabase } from '../../lib/supabase-org';
import { useMobileFirst } from '../../hooks/useMobileFirst';

interface OrganizationAuthProps {
  mode: 'signup' | 'join';
}

export const OrganizationAuth: React.FC<OrganizationAuthProps> = ({ mode }) => {
  const { slug, code } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useMobileFirst();
  
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Organization data
  const [orgData, setOrgData] = useState<any>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    phone: '',
    birthdate: '',
    gender: ''
  });

  // Load organization data and invite code if applicable
  useEffect(() => {
    if (mode === 'signup' && slug) {
      loadOrganizationData(slug);
    } else if (mode === 'join' && code) {
      loadInviteData(code);
    } else {
      setOrgLoading(false);
    }
  }, [mode, slug, code]);

  const loadOrganizationData = async (orgSlug: string) => {
    try {
      setOrgLoading(true);
      const data = await orgSupabase.getOrgSignupPage(orgSlug);
      
      if (!data) {
        setError('Organization not found');
        return;
      }
      
      setOrgData(data);
    } catch (err) {
      console.error('Failed to load organization:', err);
      setError('Failed to load organization information');
    } finally {
      setOrgLoading(false);
    }
  };

  const loadInviteData = async (inviteCode: string) => {
    try {
      setOrgLoading(true);
      
      // Get invite code details
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select(`
          *,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq('code', inviteCode.toUpperCase())
        .single();

      if (inviteError || !invite) {
        setError('Invalid or expired invite code');
        return;
      }

      // Check if invite is still valid
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        setError('This invite code has expired');
        return;
      }

      if (invite.type === 'limited' && invite.current_uses >= invite.max_uses) {
        setError('This invite code has reached its usage limit');
        return;
      }

      setInviteData(invite);
      
      // Also load the organization's signup page config
      const orgSlug = (invite.organizations as any).slug;
      if (orgSlug) {
        const orgData = await orgSupabase.getOrgSignupPage(orgSlug);
        setOrgData(orgData);
      }
    } catch (err) {
      console.error('Failed to load invite:', err);
      setError('Failed to load invite information');
    } finally {
      setOrgLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.displayName) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
            phone: formData.phone || undefined,
            birthdate: formData.birthdate || undefined,
            gender: formData.gender || undefined
          }
        }
      });

      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Handle organization joining based on mode
      if (mode === 'signup' && orgData?.id) {
        // Join organization directly (club signup)
        await joinOrganization(orgData.id, authData.user.id);
        setSuccess(`Welcome to ${orgData.name}! Please check your email to verify your account.`);
      } else if (mode === 'join' && inviteData && code) {
        // Redeem invite code
        const { data: redeemResult, error: redeemError } = await supabase.rpc('redeem_invite_code', {
          p_code: code.toUpperCase(),
          p_user_id: authData.user.id,
          p_ip_address: null, // Could be enhanced with IP detection
          p_user_agent: navigator.userAgent
        });

        if (redeemError) throw redeemError;
        
        const result = redeemResult[0];
        if (!result.success) {
          throw new Error(result.message);
        }

        setSuccess(`Successfully joined ${inviteData.organizations.name}! Please check your email to verify your account.`);
      } else {
        setSuccess('Account created successfully! Please check your email to verify your account.');
      }

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (err) {
      console.error('Signup/join failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const joinOrganization = async (organizationId: string, userId: string) => {
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role: orgData?.signup_config?.default_role || 'member',
        status: orgData?.signup_config?.auto_approve ? 'active' : 'pending'
      });

    if (error) throw error;
  };

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading organization information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-4">{success}</p>
            <p className="text-sm text-gray-500">
              Redirecting you to the dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const organizationInfo = inviteData?.organizations || orgData;
  const signupConfig = orgData?.signup_config || {};

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: signupConfig.background_type === 'image' && signupConfig.background_value
          ? `url(${signupConfig.background_value}) center/cover`
          : signupConfig.background_type === 'gradient'
          ? signupConfig.background_value
          : signupConfig.background_value || '#f9fafb'
      }}
    >
      <Card className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} backdrop-blur-sm bg-white/95`}>
        <CardHeader className="text-center pb-4">
          {organizationInfo?.logo_url && (
            <img 
              src={organizationInfo.logo_url} 
              alt={`${organizationInfo.name} logo`}
              className="w-16 h-16 mx-auto mb-4 object-cover rounded-full"
            />
          )}
          
          <CardTitle className="text-2xl font-bold">
            {signupConfig.welcome_title || `Join ${organizationInfo?.name || 'Our Community'}`}
          </CardTitle>
          
          {signupConfig.welcome_text && (
            <CardDescription className="text-base mt-2">
              {signupConfig.welcome_text}
            </CardDescription>
          )}

          {mode === 'join' && inviteData && (
            <Alert className="mt-4">
              <Users className="w-4 h-4" />
              <AlertDescription>
                You've been invited to join <strong>{inviteData.organizations.name}</strong>
                {inviteData.custom_welcome_message && (
                  <div className="mt-2 text-sm">{inviteData.custom_welcome_message}</div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {signupConfig.require_phone && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {signupConfig.require_birthdate && (
              <div className="space-y-2">
                <Label htmlFor="birthdate">Date of Birth</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{
                backgroundColor: signupConfig.button_color || '#000000',
                color: signupConfig.button_text_color || '#ffffff'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                signupConfig.button_text || 'Join Now'
              )}
            </Button>

            {(signupConfig.terms_text || signupConfig.privacy_text) && (
              <div className="text-xs text-gray-500 text-center space-y-1">
                {signupConfig.terms_text && (
                  <div>By signing up, you agree to our terms of service</div>
                )}
                {signupConfig.privacy_text && (
                  <div>We respect your privacy and protect your data</div>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};