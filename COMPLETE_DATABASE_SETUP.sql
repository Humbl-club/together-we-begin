-- COMPLETE DATABASE SETUP FOR HUMBL GIRLS CLUB
-- Run this entire file in your Supabase SQL Editor to set up the database
-- This creates all tables, functions, and initial data needed

BEGIN;

-- ============================================================================
-- STEP 1: CREATE CORE TABLES
-- ============================================================================

-- Create profiles table (extends auth.users)
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
  price_cents INTEGER DEFAULT 0,
  points_reward INTEGER DEFAULT 10,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'attended', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'free')),
  payment_amount DECIMAL(10,2),
  payment_method TEXT,
  stripe_payment_id TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attended_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, user_id)
);

-- Create event_attendance table
CREATE TABLE IF NOT EXISTS event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in_by UUID REFERENCES auth.users(id),
  qr_code_token TEXT,
  points_awarded INTEGER DEFAULT 0,
  UNIQUE(event_id, user_id)
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

-- Create challenge_participations table
CREATE TABLE IF NOT EXISTS challenge_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
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

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
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

-- Create reward_redemptions table
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID REFERENCES rewards_catalog(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member', 'admin', 'super_admin')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create admin_actions table
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: CREATE RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Admins can create events" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update events" ON events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Social posts policies
CREATE POLICY "Anyone can view posts" ON social_posts FOR SELECT USING (status = 'active');
CREATE POLICY "Users can create own posts" ON social_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON social_posts FOR UPDATE USING (auth.uid() = user_id);

-- Direct messages policies
CREATE POLICY "Users can view own messages" ON direct_messages FOR SELECT USING (
  sender_id = auth.uid() OR 
  thread_id IN (
    SELECT id FROM message_threads 
    WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
  )
);
CREATE POLICY "Users can send messages" ON direct_messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- ============================================================================
-- STEP 4: CREATE ESSENTIAL FUNCTIONS
-- ============================================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(p_user_id, auth.uid()) 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = COALESCE(p_user_id, auth.uid())
    AND is_platform_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's available points
CREATE OR REPLACE FUNCTION get_user_available_points(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(points_balance, 0) INTO v_balance
  FROM profiles
  WHERE id = COALESCE(p_user_id, auth.uid());
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment event capacity
CREATE OR REPLACE FUNCTION increment_event_capacity(p_event_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE events 
  SET current_capacity = COALESCE(current_capacity, 0) + 1 
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create invite code function
CREATE OR REPLACE FUNCTION create_invite_code(
  p_max_uses INTEGER DEFAULT 1,
  p_expires_days INTEGER DEFAULT 7,
  p_welcome_message TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Generate random 6-character code
  v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  
  -- For now, just return the code
  -- In production, this would insert into an invites table
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: CREATE TRIGGERS
-- ============================================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- STEP 6: CREATE STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES 
  ('avatars', 'avatars', true, 5242880),
  ('posts', 'posts', true, 10485760),
  ('events', 'events', true, 10485760),
  ('challenges', 'challenges', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 7: CREATE INITIAL DATA
-- ============================================================================

-- Create default admin user (update email/id as needed)
-- This assumes you already have a user - update the ID to match your user
DO $$
BEGIN
  -- Update this with your actual user ID from auth.users
  UPDATE profiles 
  SET is_admin = true, is_platform_admin = true
  WHERE email = 'max@humble.club';
END $$;

-- Create sample rewards
INSERT INTO rewards_catalog (title, description, points_required, category, is_active)
VALUES 
  ('Coffee Voucher', 'Free coffee at partner cafes', 100, 'food', true),
  ('Yoga Class', 'Free drop-in yoga class', 200, 'wellness', true),
  ('Spa Day Pass', 'One day spa access', 500, 'wellness', true),
  ('Event VIP Access', 'VIP access to next major event', 300, 'events', true),
  ('Personal Training Session', '1-hour personal training', 400, 'fitness', true)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES - Run these to check everything worked
-- ============================================================================

-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Check storage buckets
SELECT * FROM storage.buckets;

-- Check if you have an admin user
SELECT email, is_admin, is_platform_admin FROM profiles WHERE is_admin = true;