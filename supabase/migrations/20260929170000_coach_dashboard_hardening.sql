-- Migration: Coach Dashboard Hardening & RLS Package Trainee Visibility
BEGIN;

-- 1. Extend profiles select RLS policy so coaches can view athletes who have active packages with them
DROP POLICY IF EXISTS "Users can view allowed profiles" ON public.profiles;

CREATE POLICY "Users can view allowed profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.athlete_id = profiles.id AND b.coach_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.athlete_packages ap
    WHERE ap.athlete_id = profiles.id AND ap.coach_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_p
    WHERE admin_p.id = (SELECT auth.uid()) AND admin_p.role = 'admin'
  )
);

COMMIT;
