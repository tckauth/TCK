-- Supabase CLI: supabase test db
begin;
select plan(10);
select has_table('public','visits','visits table exists');
select col_is_null('public','visits','tbm_yn','TBM starts nullable');
select col_has_check('public','visits','tbm_yn','TBM O/X constraint exists');
select has_index('public','visits','visits_date_created_idx','date pagination index exists');
select has_table('public','posts','posts table exists');
select has_table('public','post_attachments','attachments table exists');
select has_table('public','survey_responses','survey response table exists');
select col_is_unique('public','survey_responses',array['survey_id','user_id'],'duplicate survey responses blocked');
select has_function('public','protect_visit_tbm',array[]::text[],'TBM protection function exists');
select has_trigger('public','visits','protect_visit_tbm_before_update','TBM protection trigger exists');
select * from finish();
rollback;
