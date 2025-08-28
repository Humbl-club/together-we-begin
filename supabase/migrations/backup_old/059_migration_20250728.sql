-- Assign admin role to the main user (Max)
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES ('71f538b8-c7ce-4f52-b9da-87ea7f6458b4', 'admin', '71f538b8-c7ce-4f52-b9da-87ea7f6458b4')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create helper function for admin user management
CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _role app_role, _assigned_by uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if the assigner is an admin
  IF NOT public.is_admin(_assigned_by) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can assign roles'
    );
  END IF;
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Insert or update the role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (_user_id, _role, _assigned_by)
  ON CONFLICT (user_id, role) DO UPDATE
  SET assigned_by = _assigned_by, assigned_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role assigned successfully'
  );
END;
$$;

-- Create function to remove user role
CREATE OR REPLACE FUNCTION public.remove_user_role(_user_id uuid, _role app_role, _removed_by uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if the remover is an admin
  IF NOT public.is_admin(_removed_by) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can remove roles'
    );
  END IF;
  
  -- Prevent removing the last admin
  IF _role = 'admin' AND (
    SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'
  ) <= 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot remove the last admin'
    );
  END IF;
  
  -- Remove the role
  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = _role;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Role removed successfully'
  );
END;
$$;

-- Create function to get users with their roles
CREATE OR REPLACE FUNCTION public.get_users_with_roles(_requesting_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  username text,
  avatar_url text,
  created_at timestamp with time zone,
  roles app_role[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if the requesting user is an admin
  IF NOT public.is_admin(_requesting_user_id) THEN
    RAISE EXCEPTION 'Only admins can view user roles';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.created_at,
    ARRAY_AGG(ur.role ORDER BY ur.role) as roles
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.id = ur.user_id
  GROUP BY p.id, p.full_name, p.username, p.avatar_url, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;