-- 최초 사용자를 Supabase Dashboard에서 생성한 뒤 아래 이메일을 바꾸어 실행하세요.
-- update public.user_roles set role_id=(select id from public.roles where name='SUPER_ADMIN')
-- where user_id=(select id from public.profiles where email='admin@example.com');
select '기본 역할, 권한, 설정은 migration에서 생성됩니다.' as result;
