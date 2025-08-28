-- Update the handle_new_user function to properly link invites to users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', '')
  );
  
  -- Assign default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  -- Link invite to user if invite_code was provided
  IF NEW.raw_user_meta_data ->> 'invite_code' IS NOT NULL THEN
    UPDATE public.invites 
    SET used_by = NEW.id
    WHERE code = NEW.raw_user_meta_data ->> 'invite_code'
      AND status = 'used'
      AND used_by IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;