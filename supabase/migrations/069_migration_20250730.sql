-- Add foreign key constraints to content_reports table
ALTER TABLE public.content_reports 
ADD CONSTRAINT content_reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.content_reports 
ADD CONSTRAINT content_reports_reported_user_id_fkey 
FOREIGN KEY (reported_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;