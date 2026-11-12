do $$
declare pub uuid; oldp uuid; newp uuid; st uuid; i int;
begin
 if exists(select 1 from publications where code='DEMO') then return; end if;
 perform set_config('app.actor','Fictional demo seed',true);
 insert into publications(code,name,purpose,privacy_review_due,access_review_due) values('DEMO','Harbour Journal Demo','Evaluate published stories and assign editorial follow-up',current_date-5,current_date+60) returning id into pub;
 insert into snapshots(publication_id,start_on,end_on,timezone,scope,coverage,fingerprint,source_name,source_base64,actor)
 values(pub,current_date-14,current_date-8,'Pacific/Auckland','All traffic, posts, all audiences','partial','demo-old','fictional-old','', 'Demo') returning id into oldp;
 insert into snapshots(publication_id,start_on,end_on,timezone,scope,coverage,fingerprint,source_name,source_base64,actor)
 values(pub,current_date-7,current_date-1,'Pacific/Auckland','All traffic, posts, all audiences','partial','demo-current','fictional-current','','Demo') returning id into newp;
 for i in 1..4 loop
 insert into stories(publication_id,url,title,author_credit,section,published_on) values(pub,
 'https://journal.example/story-'||i,
 (array['Coastal freight guide','Harbour business outlook','Winter export checklist','Community investment report'])[i],
 (array['Mere Lane','Samir Bell','Mere Lane','Ari Cole'])[i],
 (array['Guides','Business','Guides','Community'])[i],current_date-(array[180,15,240,9])[i]) returning id into st;
 insert into metrics(snapshot_id,story_id,views,visitors,engaged_minutes,search_refs,social_refs,direct_refs,title,author_credit,section,published_on,raw_row,source_row)
 select oldp,st,(array[2400,1800,900,600])[i],(array[1500,1200,700,450])[i],(array[2000,1100,800,500])[i],(array[1600,200,600,20])[i],100,150,title,author_credit,section,published_on,'{}',i from stories where id=st;
 insert into metrics(snapshot_id,story_id,views,visitors,engaged_minutes,search_refs,social_refs,direct_refs,title,author_credit,section,published_on,raw_row,source_row)
 select newp,st,(array[1200,2200,1000,800])[i],(array[800,1500,750,500])[i],(array[1000,300,900,650])[i],(array[900,300,700,30])[i],150,200,title,author_credit,section,published_on,'{}',i from stories where id=st;
 if i in (1,2) then
 insert into actions(code,story_id,description,owner,due_on) values('EDIT-00'||i,st,(array['Check freight links and update outdated examples','Review opening paragraphs against headline promise'])[i],(array['Mere Lane','Samir Bell'])[i],current_date-(array[3,-2])[i]);
 end if;
 end loop;
 insert into publications(code,name,purpose) values('ARCHIVE','Archive Desk Demo','Review historical editorial records');
end $$;
