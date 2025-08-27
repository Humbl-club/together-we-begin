-- Atomic event registration to prevent overbooking and handle concurrency safely
-- Creates a function that checks capacity, prevents duplicate registrations, inserts the registration,
-- and increments current_capacity atomically.

CREATE OR REPLACE FUNCTION public.register_for_event(
  event_id_param uuid,
  user_id_param uuid,
  payment_method_param text DEFAULT NULL,
  loyalty_points_used_param integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  evt RECORD;
  already_registered boolean;
  registration_id uuid;
BEGIN
  -- Ensure the event exists and is upcoming/ongoing
  SELECT id, max_capacity, current_capacity, status
  INTO evt
  FROM public.events
  WHERE id = event_id_param
  FOR UPDATE; -- lock row for safe capacity updates

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;

  IF evt.status NOT IN ('upcoming', 'ongoing') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event is not open for registration');
  END IF;

  -- Prevent duplicate registrations
  SELECT EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE event_id = event_id_param AND user_id = user_id_param
  ) INTO already_registered;

  IF already_registered THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already registered');
  END IF;

  -- Enforce capacity if max_capacity is set
  IF evt.max_capacity IS NOT NULL AND evt.current_capacity >= evt.max_capacity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event is full');
  END IF;

  -- Create registration first
  INSERT INTO public.event_registrations (
    event_id, user_id, payment_method, loyalty_points_used, payment_status
  ) VALUES (
    event_id_param, user_id_param, payment_method_param, loyalty_points_used_param, 'pending'
  ) RETURNING id INTO registration_id;

  -- Increment capacity (respecting NULL max_capacity which means unlimited)
  UPDATE public.events
  SET current_capacity = COALESCE(current_capacity, 0) + 1
  WHERE id = event_id_param;

  RETURN jsonb_build_object(
    'success', true,
    'registration_id', registration_id
  );
EXCEPTION
  WHEN unique_violation THEN
    -- In case a unique constraint exists on (event_id, user_id)
    RETURN jsonb_build_object('success', false, 'error', 'Already registered');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registration failed');
END;
$$;