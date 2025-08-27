-- Add public_key field to profiles table for encryption
ALTER TABLE public.profiles ADD COLUMN public_key TEXT;

-- Update the existing direct_messages table to store encrypted content
-- The content field will store encrypted data and media_url will store the nonce
COMMENT ON COLUMN public.direct_messages.content IS 'Encrypted message content';
COMMENT ON COLUMN public.direct_messages.media_url IS 'Encryption nonce for message decryption';