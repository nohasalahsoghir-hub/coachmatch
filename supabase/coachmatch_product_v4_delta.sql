-- CoachMatch V4 DB delta
-- Real product tables are the source of truth; seed/test rows remain inside those tables with is_demo=true.

ALTER TABLE public.athlete_packages ADD COLUMN IF NOT EXISTS subtotal numeric(12,2);
ALTER TABLE public.athlete_packages ADD COLUMN IF NOT EXISTS checkout_fee numeric(12,2) NOT NULL DEFAULT 10;
ALTER TABLE public.athlete_packages ADD COLUMN IF NOT EXISTS platform_commission numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.athlete_packages ADD COLUMN IF NOT EXISTS session_unit_price numeric(12,2);
ALTER TABLE public.athlete_packages ADD COLUMN IF NOT EXISTS session_coach_net numeric(12,2);
ALTER TABLE public.package_usage ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'used';
ALTER TABLE public.package_usage ADD COLUMN IF NOT EXISTS reversed_at timestamptz;

REVOKE SELECT ON public.coaches FROM anon, authenticated;
REVOKE SELECT ON public.reviews FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE requested_role text := NEW.raw_user_meta_data->>'role';
BEGIN
  INSERT INTO public.profiles(id,linked_auth_id,full_name,phone,role,is_demo)
  VALUES(NEW.id,NEW.id,COALESCE(NEW.raw_user_meta_data->>'full_name','مستخدم جديد'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone',''),'seed-'||replace(NEW.id::text,'-','')),
    CASE WHEN requested_role='coach' THEN 'coach'::user_role ELSE 'athlete'::user_role END,false);
  RETURN NEW;
END; $$;

-- The following RPCs exist in the live project and are part of the product contract:
-- create_checkout_intent, capture_test_payment, capture_package_purchase_test,
-- book_with_package, cancel_booking_v3, complete_booking_v3, settle_payout_test.
-- Their execute privileges are restricted to authenticated users; each function checks auth.uid().

ALTER TABLE public.package_usage ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'used';
ALTER TABLE public.package_usage ADD COLUMN IF NOT EXISTS reversed_at timestamptz;
ALTER TABLE public.package_usage DROP CONSTRAINT IF EXISTS package_usage_status_check;
ALTER TABLE public.package_usage ADD CONSTRAINT package_usage_status_check CHECK (status IN ('used','reversed'));

-- Final security posture: internal projection sync functions are server-only; user RPCs remain authenticated and self-authorizing.
REVOKE EXECUTE ON FUNCTION public.sync_coach_public_projection(uuid) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_public_review_row() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_sync_coach_projection() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sync_coach_public_projection(uuid) TO postgres,service_role;
GRANT EXECUTE ON FUNCTION public.sync_public_review_row() TO postgres,service_role;
GRANT EXECUTE ON FUNCTION public.trg_sync_coach_projection() TO postgres,service_role;

-- Consolidate permissive read policies into one policy per table/action.
DROP POLICY IF EXISTS "Athlete views own checkout intents" ON public.booking_checkout_intents;
DROP POLICY IF EXISTS "Athletes can view own checkout intents" ON public.booking_checkout_intents;
CREATE POLICY "Athletes view own checkout intents" ON public.booking_checkout_intents
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = athlete_id);

DROP POLICY IF EXISTS "Admins can view coaches" ON public.coaches;
DROP POLICY IF EXISTS "Coaches can view own record" ON public.coaches;
CREATE POLICY "Authorized users can view coaches" ON public.coaches
FOR SELECT TO authenticated USING (
  (SELECT auth.uid()) = id OR EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin'
  )
);

DROP POLICY IF EXISTS "Admins can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view booked athletes" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Authorized users can view profiles" ON public.profiles
FOR SELECT TO authenticated USING (
  id=(SELECT auth.uid())
  OR EXISTS(SELECT 1 FROM public.bookings b WHERE b.athlete_id=profiles.id AND b.coach_id=(SELECT auth.uid()))
  OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin')
);

-- User-created account roles: athlete or coach. Admins are provisioned server-side.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE requested_role text := NEW.raw_user_meta_data->>'role';
BEGIN
  INSERT INTO public.profiles(id,linked_auth_id,full_name,phone,role,is_demo)
  VALUES(
    NEW.id,NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name','مستخدم جديد'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone',''),'seed-'||replace(NEW.id::text,'-','')),
    CASE WHEN requested_role='coach' THEN 'coach'::user_role ELSE 'athlete'::user_role END,
    false
  );
  RETURN NEW;
END;
$$;

-- See the live migrations for the full definitions of:
-- create_checkout_intent, capture_test_payment, capture_package_purchase_test,
-- book_with_package, cancel_booking_v3, complete_booking_v3, settle_payout_test.
