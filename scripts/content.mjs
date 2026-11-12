#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table as textTable} from './lib/format.mjs';
import {page,table,record,writeOut} from './lib/render.mjs';

export const reads={
 publications:'select code,name,purpose,privacy_review_due,access_review_due from publications order by code',
 stories:'select publication,title,section,author_credit,views,visitors,seconds_per_view,start_on,end_on,coverage,id from story_performance order by views desc',
 'morning-brief':'select publication,title,views,seconds_per_view,open_actions,overdue_actions,end_on,coverage from story_performance order by views desc',
 declines:'select publication,title,previous_views,views,change_pct,open_actions,previous_start,start_on,end_on,coverage from story_comparison where change_pct<0 order by change_pct',
 evergreen:'select publication,title,published_on,views,search_refs,open_actions,start_on,end_on,coverage from story_performance where end_on-published_on>=evergreen_days and views>=min_views order by views desc',
 'low-engagement':'select publication,title,views,engaged_minutes,seconds_per_view,open_actions,start_on,end_on,coverage from story_performance where views>=min_views and seconds_per_view<low_seconds order by seconds_per_view',
 'search-led':'select publication,title,search_refs,views,open_actions,start_on,end_on,coverage from story_performance where search_refs>0 order by search_refs desc',
 'section-review':'select publication,section,start_on,end_on,coverage,count(*)::int stories,sum(views)::bigint views,sum(engaged_minutes) engaged_minutes,sum(open_actions)::int open_actions from story_performance group by publication,section,start_on,end_on,coverage order by views desc',
 'author-review':'select publication,author_credit,start_on,end_on,coverage,count(*)::int stories,sum(views)::bigint views,sum(open_actions)::int open_actions from story_performance group by publication,author_credit,start_on,end_on,coverage order by views desc',
 'refresh-queue':'select publication,title,views,change_pct,published_on,open_actions,start_on,end_on,coverage from story_comparison where change_pct<=-20 and end_on-published_on>=evergreen_days and views>=min_views order by change_pct',
 'actions-due':'select code,publication,title,owner,due_on,days_overdue,description from actions_due order by due_on,code',
 workload:'select owner,count(*)::int open_actions,count(*) filter(where days_overdue>0)::int overdue_actions from actions_due group by owner order by overdue_actions desc,owner',
 'completed-actions':'select a.code,s.title,a.owner,a.completed_on,a.evidence from actions a join stories s on s.id=a.story_id where a.status=\'done\' order by a.completed_on desc',
 compliance:'select * from compliance_checks order by rule,reference',
 attention:'select * from compliance_checks order by rule,reference',
 imports:'select p.code publication,s.start_on,s.end_on,s.timezone,s.scope,s.coverage,s.source_name,s.actor,s.fingerprint,s.id from snapshots s join publications p on p.id=s.publication_id order by s.end_on desc,p.code',
 notes:'select s.title,n.body,n.actor,n.created_at from notes n join stories s on s.id=n.story_id order by n.created_at desc',
 audit:'select entity,record_id,operation,actor,created_at from audit_log order by created_at desc,id'
};
const writes=['add-publication','add-story','add-action','complete-action','log','review-privacy','import'];
export const commands=[...Object.keys(reads),'story',...writes,'weekly-review','draft-story-brief','draft-refresh-list','export','help'];
export function parseArgs(args){
 const pos=[],o={};for(const a of args){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(k in o)throw Error(`Duplicate flag: ${k}`);o[k]=i<0?true:a.slice(i+1);}else pos.push(a);}return {pos,o};
}
function required(o,k){if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}=value`);return o[k].trim();}
export function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Expected a real YYYY-MM-DD date');return v;}
function number(v,{integer=false,optional=false}={}){if(v===''&&optional)return null;if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(v))throw Error(`Invalid nonnegative number: ${v}`);const n=Number(v.replaceAll(',',''));if(!Number.isFinite(n)||n>1e12||integer&&!Number.isSafeInteger(n))throw Error(`Invalid numeric range or integer: ${v}`);return n;}
export function canonical(v){let u;try{u=new URL(v);}catch{throw Error(`Invalid story URL: ${v}`);}if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('Story URL must be canonical HTTP(S), without credentials, query or fragment');return u.href;}
export async function resolve(db,entity,ref){
 if(!['publications','stories','actions'].includes(entity))throw Error('Invalid entity');
 if(!ref.trim())throw Error('A record reference is required');
 const name=entity==='stories'?'title':entity==='publications'?'name':'code';const rows=await db.query(`select id,${name} label${entity==='stories'?',url':entity==='publications'?',code':''} from ${entity} order by ${name}`);
 const exact=rows.filter(r=>r.id.toLowerCase()===ref.toLowerCase()||r.label.toLowerCase()===ref.toLowerCase()||r.url===ref||r.code?.toLowerCase()===ref.toLowerCase());
 const hits=exact.length?exact:rows.filter(r=>r.id.toLowerCase().startsWith(ref.toLowerCase())||r.label.toLowerCase().includes(ref.toLowerCase())||r.code?.toLowerCase().startsWith(ref.toLowerCase()));
 if(hits.length!==1)throw Error(`${hits.length?'Ambiguous':'Unknown'} ${entity} reference. Candidates: ${(hits.length?hits:rows).map(r=>`${r.code?`${r.code}: `:""}${r.label} [${r.id}]`).join('; ')}`);
 return hits[0].id;
}
async function transaction(db,actor,fn){await db.exec('BEGIN');try{await db.query("select set_config('app.actor',$1,true)",[actor]);const r=await fn();await db.exec('COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
const aliases={url:['URL','Post URL','Link'],title:['Title','Post Title'],author_credit:['Author','Authors'],section:['Section'],published_on:['Published','Publish Date','Publication Date'],views:['Views'],visitors:['Visitors'],engaged_minutes:['Engaged minutes'],search_refs:['Search refs'],social_refs:['Social refs'],direct_refs:['Direct refs']};
export function parseExport(bytes,mapping={}){
 for(const k of Object.keys(mapping))if(!(k in aliases)||typeof mapping[k]!=='string')throw Error(`Unknown or invalid mapping field: ${k}`);
 const rows=parseCsv(bytes.toString('utf8'));if(!rows.length)throw Error('CSV has no data rows');
 const headers=Object.keys(rows[0]);for(const h of headers)if(/^(?:email|e-mail|ip address|user id|visitor id|cookie|phone)$/i.test(h))throw Error(`Individual audience data is not accepted: ${h}`);
 for(const h of Object.values(mapping))if(!headers.includes(h))throw Error(`Mapped column is missing: ${h}`);
 const seen=new Set();return rows.map((raw,i)=>{
 const f={};for(const [k,names] of Object.entries(aliases))f[k]=pick(raw,...(mapping[k]?[mapping[k]]:names)).trim();
 f.url=canonical(f.url);if(seen.has(f.url))throw Error(`Duplicate story URL at CSV row ${i+2}`);seen.add(f.url);
 if(!f.title)throw Error(`Missing title at CSV row ${i+2}`);
 f.views=number(f.views,{integer:true});for(const k of ['visitors','search_refs','social_refs','direct_refs'])f[k]=number(f[k],{integer:true,optional:true});
 f.engaged_minutes=number(f.engaged_minutes,{optional:true});f.published_on=f.published_on?date(f.published_on):null;
 return {fields:f,raw,source_row:i+2};});
}
async function importCsv(db,o){
 const actor=required(o,'actor'),pub=await resolve(db,'publications',required(o,'publication'));
 const start=date(required(o,'start')),end=date(required(o,'end'));if(end<start)throw Error('End precedes start');
 const timezone=required(o,'timezone');try{new Intl.DateTimeFormat('en',{timeZone:timezone}).format();}catch{throw Error('Invalid IANA timezone');}
 const coverage=required(o,'coverage');if(!['partial','complete'].includes(coverage))throw Error('coverage must be partial or complete');
 const scope=required(o,'scope'),file=required(o,'file'),bytes=fs.readFileSync(file),mapping=o.mapping?JSON.parse(fs.readFileSync(o.mapping,'utf8')):{};
 const rows=parseExport(bytes,mapping);
 const fingerprint=crypto.createHash('sha256').update(bytes).update(JSON.stringify({pub,start,end,timezone,coverage,scope,mapping})).digest('hex');
 return transaction(db,actor,async()=>{
 // Lock the publication before duplicate and overlap checks, including concurrent Postgres imports.
 await db.query('select id from publications where id=$1 for update',[pub]);
 if((await db.query('select id from snapshots where fingerprint=$1',[fingerprint])).length)return [{skipped:true,rows:rows.length,fingerprint}];
 if((await db.query('select id from snapshots where publication_id=$1 and start_on<=$3 and end_on>=$2',[pub,start,end])).length)throw Error('Overlapping snapshot: keep one immutable export per period. Use a separate publication code for another scope or corrected series.');
 if(o['dry-run'])return [{dry_run:true,rows:rows.length,start,end,coverage,fingerprint}];
 const snapshot=(await db.query('insert into snapshots(publication_id,start_on,end_on,timezone,scope,coverage,fingerprint,source_name,source_base64,mapping,actor) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id',[pub,start,end,timezone,scope,coverage,fingerprint,path.basename(file),bytes.toString('base64'),JSON.stringify(mapping),actor]))[0].id;
 for(const {fields:f,raw,source_row} of rows){
 let st=(await db.query('select id from stories where publication_id=$1 and url=$2',[pub,f.url]))[0];
 if(!st)st=(await db.query('insert into stories(publication_id,url,title,author_credit,section,published_on) values($1,$2,$3,$4,$5,$6) returning id',[pub,f.url,f.title,f.author_credit,f.section,f.published_on]))[0];
 await db.query('insert into metrics(snapshot_id,story_id,views,visitors,engaged_minutes,search_refs,social_refs,direct_refs,title,author_credit,section,published_on,raw_row,source_row) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',[snapshot,st.id,f.views,f.visitors,f.engaged_minutes,f.search_refs,f.social_refs,f.direct_refs,f.title,f.author_credit,f.section,f.published_on,JSON.stringify(raw),source_row]);
 }
 return [{imported:rows.length,snapshot,fingerprint,coverage}];
 });
}
const allowed={
 'add-publication':['code','name','purpose','privacy-due','access-due'],
 'add-story':['publication','url','title','author','section','published'],
 'add-action':['story','code','description','owner','due'],
 'complete-action':['action','evidence','completed'], log:['story','body'],
 'review-privacy':['publication','purpose','privacy-due','access-due','evidence'],
 import:['publication','start','end','timezone','coverage','scope','file','mapping','dry-run'],
 export:['out']
};
export async function run(db,args){
 const {pos,o}=parseArgs(args),cmd=pos[0]||'help';
 if(!commands.includes(cmd))throw Error(`Unknown command: ${cmd}. Run help.`);
 for(const k of Object.keys(o))if(!['json',...(writes.includes(cmd)?['actor']:[]),...(allowed[cmd]||[])].includes(k))throw Error(`Unknown flag for ${cmd}: --${k}`);
 if(pos.length>(['story','draft-story-brief','import'].includes(cmd)?2:1))throw Error('Unexpected positional arguments');
 if(cmd in reads)return db.query(reads[cmd]);
 if(cmd==='help')return [{commands:commands.join(', '),syntax:'See docs/cli.md. Flags use --name=value. Every write needs --actor. JSON: --json.'}];
 if(cmd==='story'){
 const id=await resolve(db,'stories',pos[1]||'');const st=(await db.query('select * from stories where id=$1',[id]))[0];
 st.periods=await db.query('select m.*,s.start_on,s.end_on,s.timezone,s.coverage from metrics m join snapshots s on s.id=m.snapshot_id where m.story_id=$1 order by s.end_on desc',[id]);
 st.actions=await db.query('select * from actions where story_id=$1 order by due_on',[id]);st.notes=await db.query('select * from notes where story_id=$1 order by created_at',[id]);return [st];
 }
 if(cmd==='import'){if(pos[1]!=='parsely')throw Error('Use import parsely');return importCsv(db,o);}
 if(writes.includes(cmd))return transaction(db,required(o,'actor'),async()=>{
 const req=k=>required(o,k);
 if(cmd==='add-publication')return db.query('insert into publications(code,name,purpose,privacy_review_due,access_review_due) values($1,$2,$3,$4,$5) returning *',[req('code'),req('name'),o.purpose||'',o['privacy-due']?date(o['privacy-due']):null,o['access-due']?date(o['access-due']):null]);
 if(cmd==='add-story')return db.query('insert into stories(publication_id,url,title,author_credit,section,published_on) values($1,$2,$3,$4,$5,$6) returning *',[await resolve(db,'publications',req('publication')),canonical(req('url')),req('title'),o.author||'',o.section||'',o.published?date(o.published):null]);
 if(cmd==='add-action')return db.query('insert into actions(code,story_id,description,owner,due_on) values($1,$2,$3,$4,$5) returning *',[req('code'),await resolve(db,'stories',req('story')),req('description'),req('owner'),date(req('due'))]);
 if(cmd==='complete-action'){
 const id=await resolve(db,'actions',req('action')),completed=date(req('completed'));if(completed>new Date().toISOString().slice(0,10))throw Error('Completion cannot be in the future');
 const r=await db.query("update actions set status='done',evidence=$1,completed_on=$2 where id=$3 and status='open' returning *",[req('evidence'),completed,id]);if(!r.length)throw Error('Action already completed');return r;
 }
 if(cmd==='log')return db.query('insert into notes(story_id,body,actor) values($1,$2,$3) returning *',[await resolve(db,'stories',req('story')),req('body'),req('actor')]);
 if(cmd==='review-privacy'){
 const id=await resolve(db,'publications',req('publication'));const r=await db.query('update publications set purpose=$1,privacy_review_due=$2,access_review_due=$3 where id=$4 returning *',[req('purpose'),date(req('privacy-due')),date(req('access-due')),id]);
 await db.query("insert into audit_log(entity,record_id,operation,after_row,actor) values('privacy_review',$1,'REVIEW',$2,$3)",[id,JSON.stringify({evidence:req('evidence')}),req('actor')]);return r;
 }
 });
 if(['weekly-review','draft-story-brief','draft-refresh-list'].includes(cmd)){
 await db.exec('BEGIN READ ONLY');try{
 let sections=[];
 if(cmd==='draft-story-brief'){
 const st=(await run(db,['story',pos[1]||'']))[0];sections=[{title:'Story',html:record(st,['title','url','author_credit','section'])},{title:'Recorded periods',html:table(st.periods,['start_on','end_on','views','engaged_minutes','coverage'])},{title:'Editorial actions',html:table(st.actions,['code','description','owner','due_on','status','evidence'])},{title:'Notes',html:table(st.notes,['body','actor','created_at'])}];
 }else{for(const c of cmd==='weekly-review'?['morning-brief','declines','actions-due','compliance']:['refresh-queue','evergreen','actions-due'])sections.push({title:c,html:table(await run(db,[c]))});}
 const file=writeOut('drafts',`${cmd}-${crypto.randomUUID()}`,page({title:`Draft: ${cmd.replaceAll('-',' ')}`,subtitle:'Imported aggregate records. Partial exports describe included stories. Editorial review required.',sections}));return [{file}];
 }finally{await db.exec('ROLLBACK');}
 }
 if(cmd==='export'){
 const out=path.resolve(required(o,'out'));if(fs.existsSync(out))throw Error('Export directory already exists');
 fs.mkdirSync(out,{recursive:true,mode:0o700});await db.exec('BEGIN READ ONLY');try{
 for(const name of ['publications','stories','snapshots','metrics','actions','notes','audit_log'])fs.writeFileSync(path.join(out,`${name}.json`),JSON.stringify(await db.query(`select * from ${name}`),null,2)+'\n',{mode:0o600});
 }finally{await db.exec('ROLLBACK');}return [{directory:out,collections:7}];
 }
}
export function format(rows){if(!rows.length)return '(none)';return textTable(rows,Object.keys(rows[0]).map(key=>({key,label:key,width:44,format:v=>v===null?'unknown':typeof v==='object'?JSON.stringify(v):String(v)})));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const rows=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(rows,null,2):format(rows));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
