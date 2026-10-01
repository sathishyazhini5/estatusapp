require('dotenv').config();
const {Client}=require('pg');
const fs=require('fs');
const {spawnSync}=require('child_process');
const client=new Client({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USERNAME,password:process.env.DB_PASSWORD,ssl:{rejectUnauthorized:false},connectionTimeoutMillis:10000,statement_timeout:15000});
const results=[];
const originalLog=console.log;console.log=()=>{};let queryErrors=[];console.error=(...args)=>queryErrors.push(args.map(x=>x?.code||x?.message||String(x)).join(' '));
async function check(name,fn){try{queryErrors=[];await fn();if(queryErrors.length)throw Error(queryErrors.join(' | '));results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.code||e.message});}}
(async()=>{
for(const dir of ['models','routes','middlewares','database'])for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.js'))){await check('syntax '+dir+'/'+name,()=>{const r=spawnSync(process.execPath,['--check',dir+'/'+name],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);});}
await check('database connection',()=>client.connect());
if(results.at(-1).status==='FAIL')return;
await client.query('SET default_transaction_read_only = on');
require.cache[require.resolve('../database/db')]={id:require.resolve('../database/db'),filename:require.resolve('../database/db'),loaded:true,exports:client};
const filters=require('../models/Filters'),search=require('../models/Search'),obit=require('../models/Obituary'),dashboard=require('../models/Dashboard');
const assert=require('assert/strict');
let conf,centre,obituary;
for(const [name,keys] of [['listConfreFilters',['divtyp','memtyp','destyp','natlty']],['listCentreFilters',['divtyp','apostl','ctrtyp','diocse']],['listObituaryFilters',['memtyp']]])await check(name,async()=>{const r=await filters[name]();for(const key of keys){assert.ok(Array.isArray(r[key]));assert.equal(new Set(r[key].map(x=>x.quick_code)).size,r[key].length);for(const x of r[key])assert.equal(x.province_code,'ALL');}if(name==='listConfreFilters')conf=r;if(name==='listCentreFilters')centre=r;if(name==='listObituaryFilters')obituary=r;});
const provinces=(await client.query('SELECT province_code FROM estatus.province_mst ORDER BY province_code')).rows;
for(const province of ['ALL',...provinces.map(p=>p.province_code)]){
await check('dashboard '+province,()=>dashboard.viewDashboard(province));
await check('confreres '+province,()=>search.findConfreres(province));
await check('centres '+province,()=>search.findCentres(province));
await check('scholastics '+province,()=>search.findScholastics(province));
await check('obituary '+province,()=>obit.findObituary(province));
}
for(const [key,index] of [['memtyp',2],['natlty',4],['divtyp',6],['destyp',8]])for(const item of (conf?.[key]||[])){await check('confreres ALL '+key+' code',()=>{const args=['ALL','','ALL','ALL','ALL','ALL','ALL','ALL','ALL'];args[index]=item.quick_code;return search.findConfreres(...args);});}
for(const [key,index] of [['divtyp',2],['apostl',3],['ctrtyp',4],['diocse',5]])for(const item of (centre?.[key]||[])){await check('centres ALL '+key+' code',()=>{const args=['ALL','','ALL','ALL','ALL','ALL','ALL','ALL','ALL','ALL','ALL'];args[index]=item.quick_code;return search.findCentres(...args);});}
for(const item of (conf?.natlty||[]))await check('scholastics ALL nationality code',()=>search.findScholastics('ALL','ALL',item.quick_code));
for(const item of (obituary?.memtyp||[]))await check('obituary ALL member code',()=>obit.findObituary('ALL','',item.quick_code));

const express=require('express'),jwt=require('jsonwebtoken');
const app=express();app.use(express.json());app.use('/v1',require('../routes/index.routes'));
const server=await new Promise(resolve=>{const srv=app.listen(0,'127.0.0.1',()=>resolve(srv));});
try {
const user=await client.query("SELECT personal_mailid1 FROM estatus.confreres_dtl WHERE personal_mailid1 IS NOT NULL AND personal_mailid1 <> '' LIMIT 1");
assert.ok(user.rows.length,'No user available for authenticated HTTP tests');
const token=jwt.sign({email:user.rows[0].personal_mailid1},process.env.ACCESS_SECRET_AKEY,{expiresIn:'5m'});
const base='http://127.0.0.1:'+server.address().port+'/v1';
async function request(path,body,authenticated=true){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(authenticated?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const json=await r.json();return {http:r.status,json};}
for(const path of ['/list-confre-filters','/list-centre-filters','/list-obituary-filters','/list-province','/list-country'])await check('HTTP '+path,async()=>{const r=await request(path);assert.equal(r.http,200);assert.equal(r.json.status,true);assert.equal(r.json.statuscode,200);assert.ok(r.json.results);});
for(const path of ['/find-confreres','/find-centres','/find-scholastics','/find-obituary','/view-dashboard'])await check('HTTP '+path+' ALL',async()=>{const r=await request(path,{provincecode:'ALL',searchtxt:''});assert.equal(r.http,200);assert.equal(r.json.status,true);assert.ok(Array.isArray(r.json.results));});
await check('HTTP authentication required',async()=>{const r=await request('/list-confre-filters',undefined,false);assert.equal(r.http,401);assert.equal(r.json.status,false);});
await check('HTTP dashboard validation',async()=>{const r=await request('/view-dashboard',{});assert.equal(r.http,422);});
for(const [key,column] of [['divtyp','division_type_code'],['apostl','apostolate_code'],['ctrtyp','centre_type_code'],['diocse','diocese_code']])for(const item of centre?.[key]||[])await check('HTTP centre '+key+' code round-trip',async()=>{const r=await request('/find-centres',{provincecode:'ALL',searchtxt:'',[key]:item.quick_code});assert.equal(r.http,200);const expected=await client.query('SELECT COUNT(DISTINCT centre_code)::int AS n FROM estatus.centre_dtl WHERE '+column+' = $1',[item.quick_code]);assert.equal(r.json.results.length,expected.rows[0].n);});
} finally {await new Promise(resolve=>server.close(resolve));}

await check('anniversary',()=>obit.findAnniversary('2026-10-01'));
for(const [table,col,fn] of [['confreres_dtl','confrer_code','viewConfre'],['centre_dtl','centre_code','viewCentre'],['scholastics_dtl','scholastic_code','viewScholastic']])await check(fn,async()=>{const r=await client.query('SELECT '+col+' FROM estatus.'+table+' LIMIT 1');if(r.rows.length)await search[fn](r.rows[0][col]);});
})().catch(e=>results.push({name:'test runner',status:'FAIL',error:e.code||e.message})).finally(async()=>{await client.end().catch(()=>{});fs.writeFileSync('qa-artifacts/global-view-results.json',JSON.stringify(results,null,2));process.exitCode=results.some(x=>x.status==='FAIL')?1:0;originalLog(JSON.stringify({passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL')},null,2));});
