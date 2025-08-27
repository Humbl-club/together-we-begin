-- Direct SQL to create essential tables
-- Run this directly in Supabase SQL Editor

BEGIN;

-- Create organizations table first (needed by many other tables)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  max_members INTEGER DEFAULT 50,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (core user profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  birthdate DATE,
  gender TEXT,
  points_balance INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_platform_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  max_capacity INTEGER DEFAULT 50,
  current_capacity INTEGER DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  points_reward INTEGER DEFAULT 10,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenges table  
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT DEFAULT 'steps' CHECK (challenge_type IN ('steps', 'distance', 'activity', 'custom')),
  target_value INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  points_reward INTEGER DEFAULT 50,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  post_type TEXT DEFAULT 'post' CHECK (post_type IN ('post', 'story')),
  expires_at TIMESTAMP WITH TIME ZONE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  encrypted_content TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_threads table
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'transferred')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards_catalog table
CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  category TEXT DEFAULT 'general',
  image_url TEXT,
  stock_quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES 
  ('avatars', 'avatars', true, 5242880),
  ('posts', 'posts', true, 10485760),
  ('events', 'events', true, 10485760),
  ('challenges', 'challenges', true, 10485760)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Create essential RPC functions
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND is_platform_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_available_points(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(points_balance, 0) INTO v_balance
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_event_capacity(p_event_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE events 
  SET current_capacity = COALESCE(current_capacity, 0) + 1 
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;