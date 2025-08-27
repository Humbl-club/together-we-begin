-- Add QR code support to events table
ALTER TABLE public.events 
ADD COLUMN qr_code_token TEXT UNIQUE,
ADD COLUMN qr_code_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN qr_code_generated_by UUID,
ADD COLUMN attendance_points INTEGER DEFAULT 0;

-- Create event attendance tracking table
CREATE TABLE public.event_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  attended_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points_awarded INTEGER DEFAULT 0,
  verified_by UUID, -- Admin who verified the attendance
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one attendance record per user per event
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for event_attendance
CREATE POLICY "Users can view their own attendance"
ON public.event_attendance
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all attendance"
ON public.event_attendance
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own attendance (via QR scan)"
ON public.event_attendance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to handle QR code attendance
CREATE OR REPLACE FUNCTION public.mark_event_attendance(
  event_qr_token TEXT,
  scanning_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  event_record RECORD;
  attendance_record RECORD;
  points_to_award INTEGER;
  result JSONB;
BEGIN
  -- Find the event by QR token
  SELECT id, title, attendance_points, start_time, end_time, status
  INTO event_record
  FROM public.events
  WHERE qr_code_token = event_qr_token
    AND qr_code_token IS NOT NULL;
  
  -- Check if event exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid QR code or event not found'
    );
  END IF;
  
  -- Check if event is active/ongoing
  IF event_record.status NOT IN ('upcoming', 'ongoing') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Event is not active for attendance tracking'
    );
  END IF;
  
  -- Check if user already attended
  SELECT id, points_awarded
  INTO attendance_record
  FROM public.event_attendance
  WHERE event_id = event_record.id AND user_id = scanning_user_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have already been marked as attended for this event',
      'already_attended', true,
      'points_awarded', attendance_record.points_awarded
    );
  END IF;
  
  -- Get points to award
  points_to_award := COALESCE(event_record.attendance_points, 0);
  
  -- Insert attendance record
  INSERT INTO public.event_attendance (
    event_id,
    user_id,
    points_awarded
  ) VALUES (
    event_record.id,
    scanning_user_id,
    points_to_award
  );
  
  -- Award loyalty points if any
  IF points_to_award > 0 THEN
    INSERT INTO public.loyalty_transactions (
      user_id,
      type,
      points,
      description,
      reference_type,
      reference_id
    ) VALUES (
      scanning_user_id,
      'earned',
      points_to_award,
      'Event attendance: ' || event_record.title,
      'event_attendance',
      event_record.id
    );
  END IF;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'event_title', event_record.title,
    'points_awarded', points_to_award,
    'message', 'Attendance recorded successfully!'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You have already been marked as attended for this event'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'An error occurred while recording attendance'
    );
END;
$$;

-- Create function to generate QR code for event (admin only)
CREATE OR REPLACE FUNCTION public.generate_event_qr_code(
  event_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_id UUID;
  qr_token TEXT;
  result JSONB;
BEGIN
  -- Check if user is admin
  admin_id := auth.uid();
  
  IF NOT public.is_admin(admin_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can generate QR codes for events'
    );
  END IF;
  
  -- Generate unique QR token
  qr_token := 'event_' || event_id_param || '_' || extract(epoch from now()) || '_' || substring(gen_random_uuid()::text from 1 for 8);
  
  -- Update event with QR code
  UPDATE public.events
  SET 
    qr_code_token = qr_token,
    qr_code_generated_at = now(),
    qr_code_generated_by = admin_id
  WHERE id = event_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Event not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'qr_token', qr_token,
    'message', 'QR code generated successfully'
  );
END;
$$;

-- Add indexes for performance
CREATE INDEX idx_events_qr_code_token ON public.events(qr_code_token) WHERE qr_code_token IS NOT NULL;
CREATE INDEX idx_event_attendance_event_id ON public.event_attendance(event_id);
CREATE INDEX idx_event_attendance_user_id ON public.event_attendance(user_id);
CREATE INDEX idx_event_attendance_attended_at ON public.event_attendance(attended_at);