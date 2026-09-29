begin;

alter table public.coaches
  alter column accepting_bookings set default true;

create unique index if not exists coach_availability_slot_key
  on public.coach_availability (coach_id,day_of_week,start_time,end_time);

drop policy if exists "Authorized users can view coaches" on public.coaches;
create policy "Coaches can view own coach row"
on public.coaches for select to authenticated
using ((select auth.uid())=id);

drop policy if exists "Coaches and admins can view availability" on public.coach_availability;
create policy "Coaches can view own availability"
on public.coach_availability for select to authenticated
using ((select auth.uid())=coach_id);

create or replace function private.replace_coach_weekly_availability(
  p_user_id uuid,
  p_schedule jsonb
)
returns integer
language plpgsql
security definer
set search_path to 'public','extensions'
as $$
declare
  item jsonb;
  v_count integer:=0;
  v_day integer;
  v_start time;
  v_end time;
begin
  if p_user_id is null then raise exception 'لازم تسجل دخول'; end if;
  if jsonb_typeof(p_schedule)<>'array' then raise exception 'جدول المواعيد غير صحيح'; end if;
  if jsonb_array_length(p_schedule)>56 then raise exception 'عدد المواعيد الأسبوعية أكبر من الحد المسموح'; end if;

  delete from public.coach_availability where coach_id=p_user_id;

  for item in select value from jsonb_array_elements(p_schedule)
  loop
    v_day:=coalesce((item->>'day')::integer,-1);
    v_start:=(item->>'start_time')::time;
    v_end:=(item->>'end_time')::time;

    if v_day not between 0 and 6 then raise exception 'اليوم غير صحيح'; end if;
    if v_end<=v_start then raise exception 'وقت النهاية يجب أن يكون بعد البداية'; end if;

    insert into public.coach_availability(
      coach_id,day_of_week,start_time,end_time,timezone,is_active,is_demo
    )
    values(
      p_user_id,v_day,v_start,v_end,'Africa/Cairo',coalesce((item->>'is_active')::boolean,true),false
    );
    v_count:=v_count+1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.replace_coach_weekly_availability(p_schedule jsonb)
returns integer
language sql
security invoker
set search_path to ''
as $$
  select private.replace_coach_weekly_availability(auth.uid(),$1);
$$;

revoke all on function public.replace_coach_weekly_availability(jsonb) from public,anon;
grant execute on function public.replace_coach_weekly_availability(jsonb) to authenticated;
revoke all on function private.replace_coach_weekly_availability(uuid,jsonb) from public,anon,authenticated;
grant execute on function private.replace_coach_weekly_availability(uuid,jsonb) to authenticated;

insert into storage.buckets(id,name,public)
values('coach-avatars','coach-avatars',true)
on conflict(id) do update set public=true;

drop policy if exists "Coach avatar public read" on storage.objects;
create policy "Coach avatar public read"
on storage.objects for select to anon,authenticated
using (bucket_id='coach-avatars');

drop policy if exists "Coach avatar insert own folder" on storage.objects;
create policy "Coach avatar insert own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id='coach-avatars'
  and (storage.foldername(name))[1]=(select auth.uid()::text)
);

drop policy if exists "Coach avatar update own folder" on storage.objects;
create policy "Coach avatar update own folder"
on storage.objects for update to authenticated
using (
  bucket_id='coach-avatars'
  and (storage.foldername(name))[1]=(select auth.uid()::text)
)
with check (
  bucket_id='coach-avatars'
  and (storage.foldername(name))[1]=(select auth.uid()::text)
);

drop policy if exists "Coach avatar delete own folder" on storage.objects;
create policy "Coach avatar delete own folder"
on storage.objects for delete to authenticated
using (
  bucket_id='coach-avatars'
  and (storage.foldername(name))[1]=(select auth.uid()::text)
);

commit;
