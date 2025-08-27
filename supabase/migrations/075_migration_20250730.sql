-- Create post_reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for post_reactions
CREATE POLICY "Users can view all reactions" 
ON public.post_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own reactions" 
ON public.post_reactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" 
ON public.post_reactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);