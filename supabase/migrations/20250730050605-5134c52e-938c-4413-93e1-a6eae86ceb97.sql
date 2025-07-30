-- Create rewards catalog table
CREATE TABLE public.rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  stock_quantity INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  redemption_limit_per_user INTEGER,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward redemptions table
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  reward_id UUID NOT NULL REFERENCES public.rewards_catalog(id),
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  redemption_code TEXT,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create points expiration policies table
CREATE TABLE public.points_expiration_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  expiration_months INTEGER NOT NULL,
  applies_to_point_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expired points table
CREATE TABLE public.expired_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  points_expired INTEGER NOT NULL,
  original_transaction_id UUID REFERENCES public.loyalty_transactions(id),
  expiry_reason TEXT NOT NULL DEFAULT 'time_based',
  expired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to loyalty_transactions for better tracking
ALTER TABLE public.loyalty_transactions 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN source_category TEXT DEFAULT 'general',
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_expiration_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expired_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active rewards" ON public.rewards_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rewards" ON public.rewards_catalog
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own redemptions" ON public.reward_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemptions" ON public.reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all redemptions" ON public.reward_redemptions
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage expiration policies" ON public.points_expiration_policies
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their expired points" ON public.expired_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage expired points" ON public.expired_points
  FOR ALL USING (is_admin(auth.uid()));

-- Create function to calculate user's available points (excluding expired)
CREATE OR REPLACE FUNCTION public.get_user_available_points(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_earned INTEGER := 0;
  total_spent INTEGER := 0;
  total_expired INTEGER := 0;
BEGIN
  -- Get total earned points
  SELECT COALESCE(SUM(points), 0) INTO total_earned
  FROM public.loyalty_transactions
  WHERE user_id = user_id_param 
    AND type = 'earned'
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Get total spent points
  SELECT COALESCE(SUM(points), 0) INTO total_spent
  FROM public.loyalty_transactions
  WHERE user_id = user_id_param AND type = 'redeemed';

  -- Get total expired points
  SELECT COALESCE(SUM(points_expired), 0) INTO total_expired
  FROM public.expired_points
  WHERE user_id = user_id_param;

  RETURN GREATEST(0, total_earned - total_spent - total_expired);
END;
$$;

-- Create function to redeem reward
CREATE OR REPLACE FUNCTION public.redeem_reward(
  reward_id_param UUID,
  user_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reward_record RECORD;
  user_points INTEGER;
  redemption_id UUID;
  redemption_code TEXT;
BEGIN
  -- Get reward details
  SELECT * INTO reward_record
  FROM public.rewards_catalog
  WHERE id = reward_id_param AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reward not found or inactive'
    );
  END IF;
  
  -- Check if reward has expired
  IF reward_record.expiry_date IS NOT NULL AND reward_record.expiry_date < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reward has expired'
    );
  END IF;
  
  -- Check stock
  IF reward_record.stock_quantity IS NOT NULL AND reward_record.stock_quantity <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reward is out of stock'
    );
  END IF;
  
  -- Check user redemption limit
  IF reward_record.redemption_limit_per_user IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM public.reward_redemptions 
        WHERE user_id = user_id_param AND reward_id = reward_id_param) >= reward_record.redemption_limit_per_user THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Redemption limit reached for this reward'
      );
    END IF;
  END IF;
  
  -- Check user points
  SELECT public.get_user_available_points(user_id_param) INTO user_points;
  
  IF user_points < reward_record.points_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points'
    );
  END IF;
  
  -- Generate redemption code
  redemption_code := 'RWD_' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8));
  
  -- Create redemption record
  INSERT INTO public.reward_redemptions (
    user_id, reward_id, points_spent, redemption_code, status
  ) VALUES (
    user_id_param, reward_id_param, reward_record.points_cost, redemption_code, 'pending'
  ) RETURNING id INTO redemption_id;
  
  -- Create loyalty transaction for points spent
  INSERT INTO public.loyalty_transactions (
    user_id, type, points, description, reference_type, reference_id
  ) VALUES (
    user_id_param, 'redeemed', reward_record.points_cost, 
    'Reward redemption: ' || reward_record.title, 
    'reward_redemption', redemption_id
  );
  
  -- Update stock if applicable
  IF reward_record.stock_quantity IS NOT NULL THEN
    UPDATE public.rewards_catalog 
    SET stock_quantity = stock_quantity - 1 
    WHERE id = reward_id_param;
  END IF;
  
  -- Update user points
  UPDATE public.profiles 
  SET available_loyalty_points = available_loyalty_points - reward_record.points_cost
  WHERE id = user_id_param;
  
  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', redemption_id,
    'redemption_code', redemption_code,
    'points_spent', reward_record.points_cost
  );
END;
$$;

-- Create function to expire old points
CREATE OR REPLACE FUNCTION public.expire_old_points()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER := 0;
  transaction_record RECORD;
BEGIN
  -- Find transactions that should expire
  FOR transaction_record IN 
    SELECT * FROM public.loyalty_transactions 
    WHERE type = 'earned' 
      AND expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND id NOT IN (SELECT COALESCE(original_transaction_id, '00000000-0000-0000-0000-000000000000') FROM public.expired_points)
  LOOP
    -- Create expired points record
    INSERT INTO public.expired_points (
      user_id, points_expired, original_transaction_id, expiry_reason
    ) VALUES (
      transaction_record.user_id, 
      transaction_record.points, 
      transaction_record.id, 
      'time_based'
    );
    
    -- Update user's available points
    UPDATE public.profiles 
    SET available_loyalty_points = GREATEST(0, available_loyalty_points - transaction_record.points)
    WHERE id = transaction_record.user_id;
    
    expired_count := expired_count + 1;
  END LOOP;
  
  RETURN expired_count;
END;
$$;

-- Create function for admin points override
CREATE OR REPLACE FUNCTION public.admin_adjust_user_points(
  target_user_id UUID,
  points_adjustment INTEGER,
  reason TEXT,
  admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if admin
  IF NOT public.is_admin(admin_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can adjust user points'
    );
  END IF;
  
  -- Create transaction record
  INSERT INTO public.loyalty_transactions (
    user_id, type, points, description, reference_type, metadata
  ) VALUES (
    target_user_id, 
    CASE WHEN points_adjustment > 0 THEN 'earned' ELSE 'redeemed' END,
    ABS(points_adjustment),
    'Admin adjustment: ' || reason,
    'admin_adjustment',
    jsonb_build_object('adjusted_by', admin_user_id, 'reason', reason)
  );
  
  -- Update user points
  UPDATE public.profiles 
  SET 
    available_loyalty_points = GREATEST(0, available_loyalty_points + points_adjustment),
    total_loyalty_points = CASE 
      WHEN points_adjustment > 0 THEN total_loyalty_points + points_adjustment
      ELSE total_loyalty_points
    END
  WHERE id = target_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'points_adjusted', points_adjustment,
    'reason', reason
  );
END;
$$;

-- Insert default expiration policy
INSERT INTO public.points_expiration_policies (policy_name, expiration_months, applies_to_point_type, is_active)
VALUES ('Standard Points Expiry', 12, 'general', true);

-- Create trigger for updating updated_at timestamps
CREATE TRIGGER update_rewards_catalog_updated_at
  BEFORE UPDATE ON public.rewards_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample rewards
INSERT INTO public.rewards_catalog (title, description, points_cost, category, stock_quantity, redemption_limit_per_user) VALUES
('Event Ticket Discount (20%)', 'Get 20% off your next event ticket purchase', 50, 'events', NULL, 2),
('Premium Badge', 'Exclusive premium member badge for your profile', 100, 'badges', NULL, 1),
('Free Coffee Voucher', 'Redeem for a free coffee at participating venues', 25, 'food', 100, NULL),
('VIP Event Access', 'Priority access to VIP events and exclusive meetups', 200, 'events', 10, 1),
('Branded Water Bottle', 'Limited edition branded water bottle', 75, 'merchandise', 50, 1);