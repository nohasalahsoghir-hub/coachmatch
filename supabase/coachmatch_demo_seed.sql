-- CoachMatch demo seed
-- Safe demo-only data: every row is marked is_demo = true.

insert into public.demo_athletes
(full_name, phone, level, goals, favorite_sports, is_demo) values
('نور أحمد','01000000001','beginner',array['اللياقة','بناء العادات'],array['Fitness & Gym','Yoga'],true),
('سلمى محمد','01000000002','intermediate',array['تحسين الأداء','المرونة'],array['Tennis','Pilates'],true),
('عمر خالد','01000000003','beginner',array['خسارة الوزن','اللياقة'],array['Football','Running'],true),
('يوسف علي','01000000004','advanced',array['المنافسات','تطوير السرعة'],array['Swimming','Athletics'],true),
('ملك حسن','01000000005','intermediate',array['القوة','التحمل'],array['Boxing','Kickboxing'],true),
('آدم محمود','01000000006','beginner',array['تعلم مهارة جديدة'],array['Padel','Table Tennis'],true),
('ليان مصطفى','01000000007','intermediate',array['التوازن','المرونة'],array['Yoga','Gymnastics'],true),
('زياد سامي','01000000008','advanced',array['المنافسات','تحسين المستوى'],array['Basketball','Volleyball'],true);

insert into public.demo_coaches
(sport_id,full_name,headline,bio,experience_years,session_rate,package_8_rate,rating,total_reviews,training_locations,languages,specialization,is_verified,is_available_today,is_demo)
select s.id,
  'Coach ' || gs.n || ' - ' || s.name_en,
  case gs.n
    when 1 then 'مدرب محترف للمبتدئين'
    when 2 then 'متخصص في تطوير الأداء'
    when 3 then 'مدرب لياقة وأداء رياضي'
    else 'مدرب منافسات وتحضير متقدم'
  end,
  'مدرب تجريبي في CoachMatch لعرض رحلة الحجز والتواصل والتقييم.',
  3 + gs.n,
  150 + gs.n * 25,
  1000 + gs.n * 120,
  round((4.5 + gs.n * 0.1)::numeric,1),
  12 + gs.n * 7,
  array['Cairo','Giza','New Cairo'],
  array['Arabic','English'],
  s.name_en || ' Coaching',
  true,
  gs.n <> 3,
  true
from (select * from public.sports where is_active=true order by sort_order limit 5) s
cross join generate_series(1,4) gs(n);

insert into public.demo_coach_availability
(coach_id,day_of_week,start_time,end_time,is_active,is_demo)
select c.id,d.day_of_week,d.start_time,d.end_time,true,true
from public.demo_coaches c
cross join (values
  (0,'09:00'::time,'13:00'::time),
  (2,'16:00'::time,'20:00'::time),
  (4,'10:00'::time,'14:00'::time),
  (6,'15:00'::time,'19:00'::time)
) d(day_of_week,start_time,end_time);

with ranked as (
  select a.id athlete_id,row_number() over(order by a.id) rn
  from public.demo_athletes a
)
insert into public.demo_packages
(athlete_id,coach_id,total_sessions,remaining_sessions,price_paid,status,expires_at,is_demo)
select r.athlete_id,c.id,8,
  case when r.rn % 3 = 0 then 5 else 8 end,
  c.package_8_rate,'active',now()+interval '45 days',true
from ranked r
join public.demo_coaches c on c.id = (
  select id from public.demo_coaches
  order by id
  limit 1 offset ((r.rn - 1) % 20)
);

with ranked as (
  select a.id athlete_id,row_number() over(order by a.id) rn
  from public.demo_athletes a
),
chosen as (
  select r.*,c.id coach_id,c.session_rate
  from ranked r
  join public.demo_coaches c on c.id = (
    select id from public.demo_coaches
    order by id
    limit 1 offset ((r.rn - 1) % 20)
  )
)
insert into public.demo_bookings
(athlete_id,coach_id,package_id,session_date,start_time,end_time,location,status,total_price,platform_fee,coach_net,payment_status,subtotal,checkout_fee,platform_commission,total_amount,timezone,is_demo)
select x.athlete_id,x.coach_id,p.id,
  current_date + (x.rn % 14)::int,
  '17:00','18:00','New Cairo',
  case when x.rn % 4 = 0 then 'completed' else 'confirmed' end,
  x.session_rate,10,x.session_rate-10,'paid',
  x.session_rate,10,0,x.session_rate+10,'Africa/Cairo',true
from chosen x
left join public.demo_packages p on p.athlete_id=x.athlete_id
order by x.rn;
