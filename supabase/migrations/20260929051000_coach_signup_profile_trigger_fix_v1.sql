create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  requested_role text := new.raw_user_meta_data->>'role';
  metadata_phone text := nullif(new.raw_user_meta_data->>'phone','');
begin
  insert into public.profiles(id, linked_auth_id, full_name, phone, role, is_demo)
  values (
    new.id,
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'مستخدم جديد'),
    coalesce(metadata_phone, 'seed-' || replace(new.id::text,'-','')),
    case when requested_role='coach' then 'coach'::public.user_role else 'athlete'::public.user_role end,
    false
  );

  if requested_role = 'coach' then
    insert into public.coaches(id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$function$;
