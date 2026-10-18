// Non-mutating real API smoke. No users, messages, credentials or test emails are created.
// The sandbox cannot reach Supabase hosts; run this on GitHub Actions or an explicitly opted-in machine.
import assert from 'node:assert/strict';
import {SUPABASE_URL,SUPABASE_KEY} from '../src/cloud/client.js';
if(!process.env.GITHUB_ACTIONS&&!process.env.HUSH_LIVE_TEST){console.log('SKIP live cloud API (use GitHub Actions or HUSH_LIVE_TEST=1)');process.exit(0);}
const headers={apikey:SUPABASE_KEY};
async function request(path,options={}){return fetch(SUPABASE_URL+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(20000)});}
const settings=await request('/auth/v1/settings');assert.equal(settings.status,200,'public project key and auth endpoint must be available');const auth=await settings.json();assert.equal(auth.external?.email,true);assert.notEqual(auth.disable_signup,true);assert.equal(auth.mailer_autoconfirm,false,'email confirmation must remain enabled');console.log('PASS real Auth API / email enabled / confirmation required');
for(const table of['hush_wallets','hush_saves','hush_friend_requests','hush_presence','hush_events']){const r=await request(`/rest/v1/${table}?select=*&limit=1`);assert.ok([401,403,404].includes(r.status),`anonymous table access denied: ${table} (${r.status})`);console.log(`PASS anonymous access denied: ${table}`);}
const rpc=await request('/rest/v1/rpc/hush_bootstrap',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.ok([401,403,404].includes(rpc.status),'anonymous RPC must not return another player’s profile');console.log('PASS anonymous profile RPC denied');
