
-- Fix the overly permissive INSERT policy on activity_logs
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert own logs" ON public.activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
