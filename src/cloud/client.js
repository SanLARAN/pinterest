// Public browser configuration. This key is deliberately publishable; RLS/RPCs are the security boundary.
export const PROJECT_REF='ppylutuhhmvhgqqqnldm';
export const SUPABASE_URL=import.meta.env?.VITE_SUPABASE_URL||`https://${PROJECT_REF}.supabase.co`;
export const SUPABASE_KEY=import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_I7pieABKAi1hAe4fLJn17w__R_rQz5P';
const SITE='https://sanlaran.github.io/pinterest/';
const REDIRECTS=new Set([SITE,SITE+'play/','http://localhost:5173/','http://127.0.0.1:5173/','http://localhost:4173/','http://127.0.0.1:4173/','https://5173-isrdcm3tcqu29sewf0cdg.e2b.app/','https://5173-isrdcm3tcqu29sewf0cdg.e2b.app/play/','https://4173-isrdcm3tcqu29sewf0cdg.e2b.app/']);
for(const url of ['https://5173-itm1791ne64ck7lkpljsj.e2b.app/','https://5173-itm1791ne64ck7lkpljsj.e2b.app/play/','https://4173-itm1791ne64ck7lkpljsj.e2b.app/'])REDIRECTS.add(url);
export function authRedirect(location=globalThis.location){try{const url=new URL('.',location.href);url.search='';url.hash='';return REDIRECTS.has(url.href)?url.href:SITE;}catch{return SITE;}}
export function isAuthReturn(){try{return /access_token=|type=recovery|error_description=/.test(location.hash);}catch{return false;}}
export function hasStoredSession(){try{return!!localStorage.getItem(`sb-${PROJECT_REF}-auth-token`)||/access_token=|type=recovery|error_description=/.test(location.hash);}catch{return false;}}
export async function deadlineFetch(input,init={}){const ctrl=new AbortController(),parent=init.signal,abort=()=>ctrl.abort();if(parent?.aborted)ctrl.abort();else parent?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,10000);try{return await fetch(input,{...init,signal:ctrl.signal});}finally{clearTimeout(timer);parent?.removeEventListener('abort',abort);}}
export async function readAuthProviders(){const r=await deadlineFetch(SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:SUPABASE_KEY}});if(!r.ok)throw new Error('cloud_offline');return r.json();}
export async function createCloudClient(){
 if(import.meta.env?.DEV&&globalThis.__HUSH_CLOUD_TEST_FACTORY__)return globalThis.__HUSH_CLOUD_TEST_FACTORY__();
 const{createClient}=await import('@supabase/supabase-js');
 return createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'},global:{fetch:deadlineFetch},realtime:{params:{eventsPerSecond:2}}});
}
