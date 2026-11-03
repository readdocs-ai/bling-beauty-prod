import { spawn } from 'node:child_process';
const base='http://127.0.0.1:3211';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3211','--hostname','127.0.0.1'],{
 env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'build-placeholder',SUPABASE_SERVICE_ROLE_KEY:'build-placeholder',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',x=>output+=x);server.stderr.on('data',x=>output+=x);
try{
 let ready=false;
 for(let i=0;i<100;i++){
  try{const r=await fetch(base+'/cart');if(r.ok){ready=true;break;}}catch{}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 if(!ready)throw Error('Local test server did not start: '+output);
 const child=spawn(process.execPath,['tests/browser-worldpay.mjs'],{env:{...process.env,BLING_TEST_URL:base},stdio:'inherit'});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});
 if(code!==0)process.exitCode=1;
}finally{server.kill('SIGTERM');}
