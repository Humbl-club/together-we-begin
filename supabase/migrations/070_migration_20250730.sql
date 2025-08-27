-- Remove hardcoded mock user data
DELETE FROM public.profiles WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Also clean up any related data for this test user
DELETE FROM public.user_roles WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM public.social_posts WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM public.event_registrations WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM public.challenge_participations WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM public.loyalty_transactions WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM public.direct_messages WHERE sender_id = '550e8400-e29b-41d4-a716-446655440000' OR recipient_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM public.privacy_settings WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM public.user_notification_settings WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM public.user_appearance_settings WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM public.user_wellness_settings WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM public.user_social_settings WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';