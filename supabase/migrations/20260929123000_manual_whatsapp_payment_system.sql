-- Migration: Manual WhatsApp Payment & Admin Approval System
BEGIN;

-- 1. Add reference_code column if not exists
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reference_code text;
CREATE UNIQUE INDEX IF NOT EXISTS ux_bookings_reference_code ON public.bookings(reference_code) WHERE reference_code IS NOT NULL;

-- 2. Cleanup expired bookings helper
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','extensions'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.bookings
  SET status = 'cancelled'::booking_status,
      payment_status = 'cancelled'::payment_status,
      cancellation_reason = 'انتهاء مهلة تحويل الواتساب (ساعتان) تلقائياً',
      cancelled_at = NOW()
  WHERE status = 'pending'
    AND hold_expires_at IS NOT NULL
    AND hold_expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_pending_bookings() TO anon, authenticated, service_role;

-- 3. Update validate_booking_transition to allow Admin or Service Role to confirm pending bookings
CREATE OR REPLACE FUNCTION public.validate_booking_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','extensions'
AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    IF new.status = 'confirmed'
       AND (
         new.payment_status <> 'paid'
         OR (new.package_id IS NULL AND COALESCE(new.total_amount,0) <= 0)
         OR (new.package_id IS NOT NULL AND COALESCE(new.total_amount,0) <> 0)
       ) THEN
      RAISE EXCEPTION 'لا يمكن تأكيد الحجز قبل اكتمال الدفع أو تغطية الحصة من باقة فعالة';
    END IF;
    IF new.status = 'completed' THEN
      RAISE EXCEPTION 'لا يمكن إنشاء حجز مكتمل مباشرة';
    END IF;
    RETURN new;
  END IF;

  IF new.status IS DISTINCT FROM old.status THEN
    IF old.status = 'pending' THEN
      IF new.status NOT IN ('confirmed', 'cancelled') THEN
        RAISE EXCEPTION 'انتقال حالة الحجز غير مسموح';
      END IF;
      IF new.status = 'confirmed' THEN
        -- Allow if executed by Admin or service role (auth.uid() IS NULL or admin role)
        IF auth.uid() IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        ) THEN
          RAISE EXCEPTION 'تأكيد الحجز متاح لمدير المنصة أو عبر مسار الدفع المعتمد فقط';
        END IF;
        IF new.payment_status <> 'paid'
           OR (new.package_id IS NULL AND COALESCE(new.total_amount,0) <= 0)
           OR (new.package_id IS NOT NULL AND COALESCE(new.total_amount,0) <> 0) THEN
          RAISE EXCEPTION 'تأكيد الحجز يتطلب دفعًا ناجحًا أو تغطية من باقة';
        END IF;
      END IF;
    ELSIF old.status = 'confirmed' THEN
      IF new.status NOT IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'انتقال حالة الحجز غير مسموح';
      END IF;
      IF new.status = 'completed' THEN
        IF auth.uid() IS NOT NULL AND auth.uid() <> new.coach_id AND NOT EXISTS (
          SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        ) THEN
          RAISE EXCEPTION 'إكمال الحصة متاح للمدرب أو مدير المنصة فقط';
        END IF;
        IF ((new.session_date + new.end_time) AT TIME ZONE COALESCE(new.timezone, 'Africa/Cairo')) > NOW() THEN
          RAISE EXCEPTION 'لا يمكن إنهاء الحصة قبل موعد انتهائها';
        END IF;
        IF new.payment_status <> 'paid' THEN
          RAISE EXCEPTION 'لا يمكن إنهاء حجز غير مدفوع';
        END IF;
      END IF;
    ELSIF old.status = 'completed' THEN
      RAISE EXCEPTION 'الحجز المكتمل لا يمكن تغيير حالته';
    ELSIF old.status = 'cancelled' THEN
      RAISE EXCEPTION 'الحجز الملغي لا يمكن إعادته';
    END IF;
  END IF;

  IF new.status = 'cancelled' AND old.status <> 'cancelled' THEN
    new.cancelled_at := COALESCE(new.cancelled_at, NOW());
  END IF;
  RETURN new;
END;
$$;

-- 4. Update get_public_coach_slots to auto-cleanup expired holds and ignore expired pending bookings
DROP FUNCTION IF EXISTS public.get_public_coach_slots(uuid, integer);
DROP FUNCTION IF EXISTS private.get_public_coach_slots(uuid, integer);

CREATE OR REPLACE FUNCTION private.get_public_coach_slots(p_coach_id uuid, p_days integer DEFAULT 14)
RETURNS TABLE(session_date date, start_time time)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','extensions'
AS $$

DECLARE
  c public.coaches%ROWTYPE;
  d date;
  a public.coach_availability%ROWTYPE;
  t time;
  e time;
  s_ts timestamptz;
  e_ts timestamptz;
  now_cairo time := (timezone('Africa/Cairo', NOW()))::time;
  today_cairo date := (timezone('Africa/Cairo', NOW()))::date;
  day_count integer := GREATEST(1, LEAST(COALESCE(p_days, 14), 31));
BEGIN
  -- Cleanup any expired holds
  PERFORM public.cleanup_expired_pending_bookings();

  SELECT * INTO c FROM public.coaches WHERE id = p_coach_id AND is_verified = true;
  IF c.id IS NULL OR NOT c.accepting_bookings THEN RETURN; END IF;

  FOR d IN SELECT generate_series(today_cairo, today_cairo + (day_count - 1), INTERVAL '1 day')::date
  LOOP
    FOR a IN SELECT * FROM public.coach_availability
             WHERE coach_id = c.id AND is_active = true
               AND day_of_week = EXTRACT(dow FROM d)
    LOOP
      t := a.start_time;
      WHILE t + INTERVAL '1 hour' <= a.end_time LOOP
        e := (t + INTERVAL '1 hour')::time;
        IF NOT (d = today_cairo AND t <= now_cairo) THEN
          s_ts := ((d + t) AT TIME ZONE 'Africa/Cairo');
          e_ts := ((d + e) AT TIME ZONE 'Africa/Cairo');
          IF NOT EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.coach_id = c.id
              AND (
                b.status = 'confirmed'
                OR (b.status = 'pending' AND (b.hold_expires_at IS NULL OR b.hold_expires_at > NOW()))
              )
              AND b.session_date = d
              AND b.start_time < e
              AND b.end_time > t
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.coach_blocked_slots x
            WHERE x.coach_id = c.id AND s_ts < x.ends_at AND e_ts > x.starts_at
          ) THEN
            RETURN QUERY SELECT d, t;
          END IF;
        END IF;
        t := (t + INTERVAL '1 hour')::time;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_coach_slots(p_coach_id uuid, p_days integer DEFAULT 14)
RETURNS TABLE(session_date date, start_time time)
LANGUAGE sql
SECURITY INVOKER
AS $$ SELECT * FROM private.get_public_coach_slots($1, $2); $$;
GRANT EXECUTE ON FUNCTION public.get_public_coach_slots(uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_public_coach_slots(uuid, integer) TO anon, authenticated;

-- 5. Create Manual WhatsApp Booking Request RPC
CREATE OR REPLACE FUNCTION public.create_manual_booking_intent(
  p_coach_id uuid,
  p_session_date date,
  p_start_time time,
  p_location text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','extensions'
AS $$
DECLARE
  v_user uuid := auth.uid();
  c public.coaches%ROWTYPE;
  p public.coach_public_catalog%ROWTYPE;
  athlete public.profiles%ROWTYPE;
  v_end time;
  v_rate numeric(12,2);
  v_ref text;
  v_hold timestamptz;
  v_booking public.bookings%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول أولاً لإتمام الحجز';
  END IF;

  SELECT * INTO athlete FROM public.profiles WHERE id = v_user;
  IF athlete.role = 'coach' THEN
    RAISE EXCEPTION 'حجز الجلسات متاح لحسابات المتدربين فقط';
  END IF;

  -- Cleanup expired holds first
  PERFORM public.cleanup_expired_pending_bookings();

  -- Limit concurrent future bookings per athlete
  PERFORM private.assert_future_booking_limit(v_user, 5);

  -- Validate slot availability
  SELECT v.end_time, v.session_rate INTO v_end, v_rate
  FROM private.validate_booking_slot(v_user, p_coach_id, p_session_date, p_start_time, p_location) v;

  SELECT * INTO c FROM public.coaches WHERE id = p_coach_id;
  SELECT * INTO p FROM public.coach_public_catalog WHERE id = p_coach_id;
  IF v_rate <= 0 THEN
    RAISE EXCEPTION 'سعر الحصة غير متاح حالياً';
  END IF;

  -- Generate human reference code e.g. CM-7A2B9C
  v_ref := 'CM-' || UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6));
  v_hold := NOW() + INTERVAL '2 hours';

  INSERT INTO public.bookings (
    athlete_id, coach_id, session_date, start_time, end_time, location,
    status, total_price, platform_fee, coach_net, payment_status,
    subtotal, checkout_fee, platform_commission, total_amount, timezone,
    is_demo, idempotency_key, hold_expires_at, reference_code
  ) VALUES (
    v_user, p_coach_id, p_session_date, p_start_time, v_end, p_location,
    'pending'::booking_status, v_rate, 10, v_rate, 'pending'::payment_status,
    v_rate, 10, 0, (v_rate + 10), 'Africa/Cairo',
    COALESCE(c.is_demo, false), 'manual:' || v_user || ':' || p_coach_id || ':' || p_session_date || ':' || p_start_time,
    v_hold, v_ref
  ) RETURNING * INTO v_booking;

  -- Notify athlete with details
  INSERT INTO public.notifications (user_id, type, title, body, link, is_demo)
  VALUES (
    v_user, 'booking', 'طلب حجز قيد الدفع (' || v_ref || ')',
    'تم تسجيل طلب الحجز مؤقتاً. يرجى تحويل ' || (v_rate + 10) || ' ج.م عبر انستاباي أو فودافون كاش وإرسال الإيصال عبر واتساب خلال ساعتين.',
    '/dashboard', v_booking.is_demo
  );

  RETURN jsonb_build_object(
    'booking_id', v_booking.id,
    'reference_code', v_ref,
    'coach_name', COALESCE(p.full_name, 'الكابتن'),
    'coach_sports', COALESCE(p.sports, ARRAY[]::text[]),
    'session_date', v_booking.session_date,
    'start_time', v_booking.start_time,
    'end_time', v_booking.end_time,
    'location', v_booking.location,
    'subtotal', v_booking.subtotal,
    'checkout_fee', v_booking.checkout_fee,
    'total_amount', v_booking.total_amount,
    'hold_expires_at', v_booking.hold_expires_at,
    'athlete_name', COALESCE(athlete.full_name, 'المتدرب'),
    'athlete_phone', COALESCE(athlete.phone, '')
  );
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'عذراً، هذا الموعد تم حجزه للتو من متدرب آخر. يرجى اختيار موعد متاح آخر.';
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_manual_booking_intent(uuid, date, time, text) TO authenticated;

-- 6. Admin Confirm Manual Booking RPC
CREATE OR REPLACE FUNCTION public.admin_confirm_manual_booking(
  p_booking_id uuid,
  p_payment_method text DEFAULT 'instapay',
  p_transfer_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','extensions'
AS $$
DECLARE
  v_admin uuid := auth.uid();
  b public.bookings%ROWTYPE;
  p_pay public.payments%ROWTYPE;
  coach_prof public.profiles%ROWTYPE;
  athlete_prof public.profiles%ROWTYPE;
  pay_ref text;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin AND role = 'admin') THEN
    RAISE EXCEPTION 'غير مصرح: هذا الإجراء متاح لمدير المنصة فقط';
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF b.id IS NULL THEN
    RAISE EXCEPTION 'طلب الحجز غير موجود';
  END IF;
  IF b.status = 'confirmed' THEN
    RAISE EXCEPTION 'هذا الحجز تم تأكيده بالفعل مسبقاً';
  END IF;
  IF b.status = 'cancelled' THEN
    RAISE EXCEPTION 'هذا الحجز ملغي ولا يمكن تأكيده';
  END IF;

  pay_ref := COALESCE(NULLIF(TRIM(p_transfer_reference),''), 'MANUAL-' || COALESCE(b.reference_code, b.id::text));

  -- Insert payment record
  INSERT INTO public.payments (
    booking_id, athlete_id, amount, currency, status,
    payment_method, provider_reference, paid_at, is_demo
  ) VALUES (
    b.id, b.athlete_id, b.total_amount, 'EGP', 'paid'::payment_status,
    COALESCE(p_payment_method, 'instapay'), pay_ref, NOW(), b.is_demo
  ) RETURNING * INTO p_pay;

  -- Confirm booking
  UPDATE public.bookings
  SET status = 'confirmed'::booking_status,
      payment_status = 'paid'::payment_status,
      hold_expires_at = NULL
  WHERE id = b.id;

  -- Insert double-entry ledger rows
  INSERT INTO public.money_ledger (
    booking_id, payment_id, athlete_id, coach_id, entry_type, direction,
    amount, reference, metadata, account_type, account_id, is_demo
  ) VALUES
    (b.id, p_pay.id, b.athlete_id, b.coach_id, 'payment', 'credit', b.total_amount, pay_ref, jsonb_build_object('type','manual_collection'), 'platform_clearing', NULL, b.is_demo),
    (b.id, p_pay.id, b.athlete_id, b.coach_id, 'platform_fee', 'debit', COALESCE(b.checkout_fee,10), pay_ref, jsonb_build_object('type','platform_revenue'), 'platform_revenue', NULL, b.is_demo),
    (b.id, p_pay.id, b.athlete_id, b.coach_id, 'coach_net', 'debit', b.coach_net, pay_ref, jsonb_build_object('type','coach_payable'), 'coach_payable', b.coach_id, b.is_demo);

  -- Schedule coach payout
  IF NOT EXISTS (SELECT 1 FROM public.payouts WHERE payout_reference = pay_ref || '-PAYOUT') THEN
    INSERT INTO public.payouts (coach_id, amount, currency, status, period_start, period_end, payout_reference, is_demo)
    VALUES (b.coach_id, b.coach_net, 'EGP', 'pending'::payout_status, b.session_date, b.session_date, pay_ref || '-PAYOUT', b.is_demo);
  END IF;

  SELECT * INTO coach_prof FROM public.profiles WHERE id = b.coach_id;
  SELECT * INTO athlete_prof FROM public.profiles WHERE id = b.athlete_id;

  -- Send notification to Athlete
  INSERT INTO public.notifications (user_id, type, title, body, link, is_demo)
  VALUES (
    b.athlete_id, 'booking', 'تم تأكيد حجزك رسمياً! ✅',
    'استلمنا تأكيد التحويل (' || COALESCE(b.reference_code, '') || ') وتم تثبيت موعدك مع الكابتن يوم ' || b.session_date || ' الساعة ' || SUBSTRING(b.start_time::text, 1, 5) || '.',
    '/dashboard', b.is_demo
  );

  -- Send notification to Coach
  INSERT INTO public.notifications (user_id, type, title, body, link, is_demo)
  VALUES (
    b.coach_id, 'booking', 'حجز جديد مؤكد 📅',
    'تم تأكيد حجز موعد تدريب جديد في جدولك مع ' || COALESCE(athlete_prof.full_name, 'متدرب') || ' يوم ' || b.session_date || ' الساعة ' || SUBSTRING(b.start_time::text, 1, 5) || '.',
    '/coach/dashboard', b.is_demo
  );

  RETURN jsonb_build_object('success', true, 'booking_id', b.id, 'status', 'confirmed');
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_confirm_manual_booking(uuid, text, text) TO authenticated;

-- 7. Admin Reject / Cancel Manual Booking RPC
CREATE OR REPLACE FUNCTION public.admin_reject_manual_booking(
  p_booking_id uuid,
  p_reason text DEFAULT 'لم يتم استلام تحويل المبلغ عبر واتساب'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','extensions'
AS $$
DECLARE
  v_admin uuid := auth.uid();
  b public.bookings%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin AND role = 'admin') THEN
    RAISE EXCEPTION 'غير مصرح: هذا الإجراء متاح لمدير المنصة فقط';
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF b.id IS NULL THEN
    RAISE EXCEPTION 'طلب الحجز غير موجود';
  END IF;
  IF b.status <> 'pending' THEN
    RAISE EXCEPTION 'فقط الطلبات المعلقة يمكن إلغاؤها من هذا القسم';
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled'::booking_status,
      payment_status = 'cancelled'::payment_status,
      cancellation_reason = COALESCE(NULLIF(TRIM(p_reason),''), 'تم الإلغاء بواسطة الإدارة لعدم اكتمال التحويل'),
      cancelled_at = NOW(),
      cancelled_by = v_admin
  WHERE id = b.id;

  INSERT INTO public.notifications (user_id, type, title, body, link, is_demo)
  VALUES (
    b.athlete_id, 'booking', 'تم إلغاء طلب الحجز (' || COALESCE(b.reference_code, '') || ')',
    'نأسف، تم إلغاء طلب الحجز للسبب: ' || COALESCE(NULLIF(TRIM(p_reason),''), 'لم يتم استلام التحويل خلال المهلة المحددة.'),
    '/dashboard', b.is_demo
  );

  RETURN jsonb_build_object('success', true, 'booking_id', b.id, 'status', 'cancelled');
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_reject_manual_booking(uuid, text) TO authenticated;

COMMIT;
