create table publications (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 purpose text not null default '', privacy_review_due date, access_review_due date,
 evergreen_days integer not null default 90 check(evergreen_days>0), min_views integer not null default 100 check(min_views>0),
 low_seconds numeric not null default 30 check(low_seconds>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table stories (
 id uuid primary key default gen_random_uuid(), publication_id uuid not null references publications,
 url text not null, title text not null, author_credit text not null default '', section text not null default '',
 published_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(publication_id,url)
);
create table snapshots (
 id uuid primary key default gen_random_uuid(), publication_id uuid not null references publications,
 start_on date not null, end_on date not null, timezone text not null, scope text not null,
 coverage text not null check(coverage in ('partial','complete')), fingerprint text not null unique,
 source_name text not null, source_base64 text not null, mapping jsonb not null default '{}', actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(end_on>=start_on), unique(publication_id,start_on,end_on)
);
create table metrics (
 id uuid primary key default gen_random_uuid(), snapshot_id uuid not null references snapshots,
 story_id uuid not null references stories, views bigint not null check(views>=0),
 visitors bigint check(visitors>=0), engaged_minutes numeric check(engaged_minutes>=0),
 search_refs bigint check(search_refs>=0), social_refs bigint check(social_refs>=0), direct_refs bigint check(direct_refs>=0),
 title text not null, author_credit text not null, section text not null, published_on date,
 raw_row jsonb not null, source_row integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(snapshot_id,story_id)
);
create table actions (
 id uuid primary key default gen_random_uuid(), code text not null unique, story_id uuid not null references stories,
 description text not null, owner text not null, due_on date not null,
 status text not null default 'open' check(status in ('open','done')), evidence text not null default '',
 completed_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((status='open' and completed_on is null) or (status='done' and completed_on is not null and length(trim(evidence))>0))
);
create table notes (
 id uuid primary key default gen_random_uuid(), story_id uuid not null references stories,
 body text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table audit_log (
 id uuid primary key default gen_random_uuid(), entity text not null, record_id uuid not null,
 operation text not null, before_row jsonb, after_row jsonb, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function append_only() returns trigger language plpgsql as $$ begin raise exception '% is append-only',tg_table_name; end $$;
create function audit_change() returns trigger language plpgsql as $$
begin
 insert into audit_log(entity,record_id,operation,before_row,after_row,actor)
 values(tg_table_name,new.id,tg_op,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new),coalesce(nullif(current_setting('app.actor',true),''),'database operator'));
 return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['publications','stories','snapshots','metrics','actions','notes','audit_log'] loop
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 end loop;
 foreach t in array array['snapshots','metrics','notes','audit_log'] loop
 execute format('create trigger immutable before update or delete on %I for each row execute function append_only()',t);
 end loop;
 foreach t in array array['publications','stories','actions','notes'] loop
 execute format('create trigger audit after insert or update on %I for each row execute function audit_change()',t);
 end loop;
end $$;
create index metrics_story on metrics(story_id);
create index actions_story on actions(story_id);
create view latest_snapshots as
 select * from (select s.*,row_number() over(partition by publication_id order by end_on desc) as rank from snapshots s) q where rank=1;
create view story_performance as
 select p.code publication,st.id,st.url,m.title,m.author_credit,m.section,m.published_on,
 s.start_on,s.end_on,s.timezone,s.coverage,m.views,m.visitors,m.engaged_minutes,m.search_refs,m.social_refs,m.direct_refs,
 round(m.engaged_minutes*60/nullif(m.views,0),2) seconds_per_view,
 p.evergreen_days,p.min_views,p.low_seconds,
 (select count(*)::int from actions a where a.story_id=st.id and a.status='open') open_actions,
 (select count(*)::int from actions a where a.story_id=st.id and a.status='open' and a.due_on<current_date) overdue_actions
 from latest_snapshots s join publications p on p.id=s.publication_id join metrics m on m.snapshot_id=s.id join stories st on st.id=m.story_id;
create view story_comparison as
 select c.*,prev.views previous_views,prev.engaged_minutes previous_minutes,pr.start_on previous_start,
 round((c.views-prev.views)*100.0/nullif(prev.views,0),2) change_pct
 from story_performance c join stories st on st.id=c.id join latest_snapshots nowp on nowp.publication_id=st.publication_id
 join lateral (select * from snapshots p where p.publication_id=st.publication_id and p.end_on<nowp.start_on order by p.end_on desc limit 1) pr on true
 join metrics prev on prev.snapshot_id=pr.id and prev.story_id=c.id
 where nowp.end_on-nowp.start_on=pr.end_on-pr.start_on and pr.end_on+1=nowp.start_on
 and pr.timezone=nowp.timezone and pr.scope=nowp.scope and pr.coverage=nowp.coverage;
create view actions_due as
 select a.code,st.title,p.code publication,a.owner,a.description,a.due_on,current_date-a.due_on days_overdue,a.status,a.id,st.id story_id
 from actions a join stories st on st.id=a.story_id join publications p on p.id=st.publication_id where a.status='open';
create view compliance_checks as
 select 'P01' rule,p.code reference,'Record why bylines and editorial notes are needed' issue from publications p where trim(p.purpose)=''
 union all select 'P09',p.code,'Review retention purpose and recorded personal information' from publications p where p.privacy_review_due is null or p.privacy_review_due<current_date
 union all select 'P05',p.code,'Record a current access and backup review' from publications p where p.access_review_due is null or p.access_review_due<current_date
 union all select 'D01',p.code,'Latest snapshot is missing or more than 14 days old' from publications p left join latest_snapshots s on s.publication_id=p.id where s.id is null or s.end_on<current_date-14
 union all select 'D02',p.code,'Partial export: results describe included stories only' from latest_snapshots s join publications p on p.id=s.publication_id where s.coverage='partial'
 union all select 'D03',p.code,'No comparable adjacent period with the same duration, timezone, scope and coverage' from latest_snapshots s join publications p on p.id=s.publication_id where not exists(select 1 from snapshots x where x.publication_id=s.publication_id and x.end_on+1=s.start_on and x.end_on-x.start_on=s.end_on-s.start_on and x.timezone=s.timezone and x.scope=s.scope and x.coverage=s.coverage)
 union all select 'D04',a.code,'Overdue editorial action' from actions a where a.status='open' and a.due_on<current_date;
