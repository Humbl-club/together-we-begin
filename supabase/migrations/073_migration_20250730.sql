-- Add missing columns for notification frequency and quiet hours
ALTER TABLE public.user_notification_settings 
ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'immediate',
ADD COLUMN IF NOT EXISTS quiet_hours_start TEXT DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS quiet_hours_end TEXT DEFAULT '07:00';