import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TrialsAndGrants: React.FC = () => {
  const [trialEnabled, setTrialEnabled] = useState(false);
  const [trialDays, setTrialDays] = useState<number>(14);
  const [defaultTier, setDefaultTier] = useState<'basic'|'pro'|'enterprise'>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);

  const [orgs, setOrgs] = useState<Array<{id:string; name:string; slug:string}>>([]);
  const [grantOrgId, setGrantOrgId] = useState<string>('');
  const [grantTier, setGrantTier] = useState<'free'|'basic'|'pro'|'enterprise'>('pro');
  const [grantType, setGrantType] = useState<'trial'|'free'|'sponsored'>('trial');
  const [grantDays, setGrantDays] = useState<number>(30);
  const [grantNotes, setGrantNotes] = useState<string>('');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'global_trial')
        .maybeSingle();
      const v = (data?.value || {}) as any;
      if (typeof v.enabled === 'boolean') setTrialEnabled(v.enabled);
      if (typeof v.days === 'number') setTrialDays(v.days);
      if (typeof v.default_tier === 'string') setDefaultTier(v.default_tier);

      const { data: orgList } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .order('created_at', { ascending: false })
        .limit(200);
      setOrgs(orgList || []);
    })();
  }, []);

  const saveTrialSettings = async () => {
    try {
      setSaving(true); setError(null); setSuccess(null);
      const value = { enabled: trialEnabled, days: trialDays, default_tier: defaultTier };
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ key: 'global_trial', value, updated_at: new Date().toISOString() })
        .select('key')
        .maybeSingle();
      if (error) throw error;
      setSuccess('Trial settings saved');
    } catch (e:any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const grantMembership = async () => {
    try {
      if (!grantOrgId) { setError('Select an organization'); return; }
      setGranting(true); setError(null); setSuccess(null);
      const ends = new Date();
      if (grantType === 'trial' && grantDays > 0) ends.setDate(ends.getDate() + grantDays);
      const expires_at = grantType === 'trial' ? ends.toISOString() : null;
      // Insert grant record
      const { error: gerr } = await supabase
        .from('organization_membership_grants')
        .insert({
          organization_id: grantOrgId,
          grant_type: grantType,
          tier: grantTier,
          days: grantType === 'trial' ? grantDays : null,
          expires_at,
          notes: grantNotes || null,
        });
      if (gerr) throw gerr;
      // Apply to organization immediately
      const { error: oerr } = await supabase
        .from('organizations')
        .update({ subscription_tier: grantTier, subscription_status: grantType === 'trial' ? 'trialing' : 'active' })
        .eq('id', grantOrgId);
      if (oerr) throw oerr;
      setSuccess('Membership grant applied');
    } catch (e:any) {
      setError(e.message || 'Failed to grant membership');
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Free Trials</CardTitle>
          <CardDescription>Toggle trials for new signups and set defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
          )}
          {success && (
            <Alert className="border-green-200 bg-green-50"><AlertDescription className="text-green-700">{success}</AlertDescription></Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Trials Enabled</Label>
              <Select value={trialEnabled ? 'on' : 'off'} onValueChange={(v) => setTrialEnabled(v==='on')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trial Length (days)</Label>
              <Input type="number" min={1} max={365} value={trialDays} onChange={(e) => setTrialDays(Math.max(1, Math.min(365, parseInt(e.target.value||'1'))))} />
            </div>
            <div className="space-y-2">
              <Label>Default Trial Tier</Label>
              <Select value={defaultTier} onValueChange={(v:any) => setDefaultTier(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveTrialSettings} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign Free Membership / Trial</CardTitle>
          <CardDescription>Grant a free tier or trial to a specific organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={grantOrgId} onValueChange={setGrantOrgId}>
                <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
                <SelectContent className="max-h-64 overflow-auto">
                  {orgs.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name} ({o.slug})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grant Type</Label>
              <Select value={grantType} onValueChange={(v:any) => setGrantType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="sponsored">Sponsored</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select value={grantTier} onValueChange={(v:any) => setGrantTier(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Days (for Trial)</Label>
              <Input type="number" min={1} max={365} value={grantDays} onChange={(e) => setGrantDays(Math.max(1, Math.min(365, parseInt(e.target.value||'30'))))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={grantNotes} onChange={(e) => setGrantNotes(e.target.value)} placeholder="Reason or reference…" />
          </div>
          <div className="flex justify-end">
            <Button onClick={grantMembership} disabled={granting || !grantOrgId}>{granting ? 'Applying…' : 'Apply Grant'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

