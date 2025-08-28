-- Create admin action log table for audit trail
CREATE TABLE public.admin_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all admin actions
CREATE POLICY "Admins can view all admin actions" 
ON public.admin_actions 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create policy for admins to insert admin actions
CREATE POLICY "Admins can insert admin actions" 
ON public.admin_actions 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()) AND auth.uid() = admin_id);

-- Add index for performance
CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at);

-- Create system configuration table
CREATE TABLE public.system_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage system config
CREATE POLICY "Admins can view system config" 
ON public.system_config 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update system config" 
ON public.system_config 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert system config" 
ON public.system_config 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Create notification templates table
CREATE TABLE public.notification_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for notification templates
CREATE POLICY "Admins can manage notification templates" 
ON public.notification_templates 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add updated_at trigger for system_config
CREATE TRIGGER update_system_config_updated_at
BEFORE UPDATE ON public.system_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for notification_templates
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    action_text TEXT,
    target_type_text TEXT,
    target_id_param UUID DEFAULT NULL,
    details_param JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.admin_actions (admin_id, action, target_type, target_id, details)
    VALUES (auth.uid(), action_text, target_type_text, target_id_param, details_param);
END;
$$;

-- Enhance invite system with better tracking
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS invite_type TEXT DEFAULT 'general';
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 1;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update invite status when used
CREATE OR REPLACE FUNCTION public.use_invite_code(_code TEXT, _user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    invite_record RECORD;
    result JSONB;
BEGIN
    -- Get invite details
    SELECT id, max_uses, current_uses, status, expires_at, created_by
    INTO invite_record
    FROM public.invites
    WHERE code = _code;
    
    -- Check if invite exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid invite code'
        );
    END IF;
    
    -- Check if invite is expired
    IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invite code has expired'
        );
    END IF;
    
    -- Check if invite has reached max uses
    IF invite_record.current_uses >= invite_record.max_uses THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invite code has been fully used'
        );
    END IF;
    
    -- Update invite usage
    UPDATE public.invites
    SET 
        current_uses = current_uses + 1,
        status = CASE 
            WHEN current_uses + 1 >= max_uses THEN 'used'::invite_status
            ELSE status
        END,
        used_by = CASE 
            WHEN current_uses = 0 THEN _user_id
            ELSE used_by
        END,
        used_at = CASE 
            WHEN current_uses = 0 THEN NOW()
            ELSE used_at
        END
    WHERE id = invite_record.id;
    
    -- Log admin action
    PERFORM public.log_admin_action(
        'invite_used',
        'invite',
        invite_record.id,
        jsonb_build_object('user_id', _user_id, 'code', _code)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Invite code used successfully'
    );
END;
$$;

-- Create function to generate invite codes
CREATE OR REPLACE FUNCTION public.create_invite_code(
    _created_by UUID,
    _invite_type TEXT DEFAULT 'general',
    _max_uses INTEGER DEFAULT 1,
    _expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    _notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_code TEXT;
    invite_id UUID;
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin(_created_by) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only admins can create invite codes'
        );
    END IF;
    
    -- Generate unique code
    new_code := upper(substring(gen_random_uuid()::text from 1 for 8));
    
    -- Ensure code is unique
    WHILE EXISTS (SELECT 1 FROM public.invites WHERE code = new_code) LOOP
        new_code := upper(substring(gen_random_uuid()::text from 1 for 8));
    END LOOP;
    
    -- Insert invite
    INSERT INTO public.invites (
        code, created_by, invite_type, max_uses, expires_at, notes, status
    ) VALUES (
        new_code, _created_by, _invite_type, _max_uses, _expires_at, _notes, 'pending'
    ) RETURNING id INTO invite_id;
    
    -- Log admin action
    PERFORM public.log_admin_action(
        'invite_created',
        'invite',
        invite_id,
        jsonb_build_object('code', new_code, 'type', _invite_type, 'max_uses', _max_uses)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'code', new_code,
        'invite_id', invite_id
    );
END;
$$;