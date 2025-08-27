-- Add notes column to invites table for tracking purpose
ALTER TABLE public.invites ADD COLUMN notes TEXT;

-- Add created_by profile information for better analytics
-- This is already linking to auth.users via created_by UUID
-- We don't need to modify this since we can join with profiles table