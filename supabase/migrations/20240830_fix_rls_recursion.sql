-- Fix infinite recursion in RLS policies
-- The issue is that policies on organization_members table are checking themselves

-- First, disable RLS temporarily on organization_members to break the cycle
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;

-- Create non-recursive policies for organization_members
CREATE POLICY "Users can view their own memberships"
ON public.organization_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Organization admins can manage members"
ON public.organization_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Re-enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Fix the is_member_of_organization function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_member_of_organization(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$;

-- Fix the is_admin_of_organization function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin_of_organization(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  );
$$;

-- Now fix policies on other tables to use the corrected functions
-- Organizations table
DROP POLICY IF EXISTS "Members can view organization" ON public.organizations;
CREATE POLICY "Members can view organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Events table
DROP POLICY IF EXISTS "Members can view events" ON public.events;
CREATE POLICY "Members can view events"
ON public.events
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Challenges table
DROP POLICY IF EXISTS "Members can view challenges" ON public.challenges;
CREATE POLICY "Members can view challenges"
ON public.challenges
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Social posts table
DROP POLICY IF EXISTS "Members can view posts" ON public.social_posts;
CREATE POLICY "Members can view posts"
ON public.social_posts
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Loyalty transactions table
DROP POLICY IF EXISTS "Users can view their transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view their transactions"
ON public.loyalty_transactions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);