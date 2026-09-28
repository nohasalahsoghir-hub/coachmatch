begin;

create or replace function private.get_public_coach_slots(
  p_coach_id uuid,p_days integer default 14
)
returns table(session_date date,start_time time)
language plpgsql security definer
set search_path to 'public','extensions'
as $$
declare
  c public.coaches%rowtype; d date; a public.coach_availability%rowtype;
  t time; e time; s_ts timestamptz; e_ts timestamptz;
  now_cairo time:=(timezone('Africa/Cairo',now()))::time;
  today_cairo date:=(timezone('Africa/Cairo',now()))::date;
  day_count integer:=greatest(1,least(coalesce(p_days,14),31));
begin
  select * into c from public.coaches where id=p_coach_id and is_verified=true;
  if c.id is null or not c.accepting_bookings then return; end if;
  for d in select generate_series(today_cairo,today_cairo+(day_count-1),interval '1 day')::date loop
    for a in select * from public.coach_availability where coach_id=c.id and is_active=true and day_of_week=extract(dow from d) loop
      t:=a.start_time;
      while t+interval '1 hour'<=a.end_time loop
        e:=(t+interval '1 hour')::time;
        if not(d=today_cairo and t<=now_cairo) then
          s_ts:=((d+t) at time zone 'Africa/Cairo'); e_ts:=((d+e) at time zone 'Africa/Cairo');
          if not exists(select 1 from public.bookings b where b.coach_id=c.id and b.status in('pending','confirmed') and b.session_date=d and b.start_time<e and b.end_time>t)
          and not exists(select 1 from public.coach_blocked_slots x where x.coach_id=c.id and s_ts<x.ends_at and e_ts>x.starts_at)
          then return query select d,t; end if;
        end if;
        t:=(t+interval '1 hour')::time;
      end loop;
    end loop;
  end loop;
end;
$$;

create or replace function private.get_public_coach_slot_counts()
returns table(coach_id uuid,today_slots integer)
language plpgsql security definer
set search_path to 'public','extensions'
as $$
declare c record; n integer;
begin
  for c in select id from public.coaches where is_verified=true and accepting_bookings=true loop
    select count(*) into n from private.get_public_coach_slots(c.id,1);
    coach_id:=c.id; today_slots:=coalesce(n,0); return next;
  end loop;
end;
$$;

grant execute on function private.get_public_coach_slots(uuid,integer) to anon,authenticated;
grant execute on function private.get_public_coach_slot_counts() to anon,authenticated;

drop function if exists public.get_public_coach_slots(uuid,integer);
create function public.get_public_coach_slots(p_coach_id uuid,p_days integer default 14)
returns table(session_date date,start_time time)
language sql security invoker
set search_path to ''
as $$ select * from private.get_public_coach_slots($1,$2); $$;

drop function if exists public.get_public_coach_slot_counts();
create function public.get_public_coach_slot_counts()
returns table(coach_id uuid,today_slots integer)
language sql security invoker
set search_path to ''
as $$ select * from private.get_public_coach_slot_counts(); $$;

revoke all on function public.get_public_coach_slots(uuid,integer) from public,anon,authenticated;
grant execute on function public.get_public_coach_slots(uuid,integer) to anon,authenticated;
revoke all on function public.get_public_coach_slot_counts() from public,anon,authenticated;
grant execute on function public.get_public_coach_slot_counts() to anon,authenticated;

commit;
