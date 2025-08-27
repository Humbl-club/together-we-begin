-- Add missing RPC functions needed by Edge Functions and frontend

-- Function to increment event capacity after successful registration
CREATE OR REPLACE FUNCTION increment_event_capacity(event_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE events 
    SET current_capacity = COALESCE(current_capacity, 0) + 1 
    WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (called by Edge Functions)
GRANT EXECUTE ON FUNCTION increment_event_capacity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_event_capacity(UUID) TO service_role;

COMMENT ON FUNCTION increment_event_capacity(UUID) IS 'Increment event capacity after successful registration (called by verify-payment Edge Function)';