import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=readdirSync('.').filter(name=>/^tests-.*\.mjs$/.test(name)).sort();
let failed=0;
for(const file of files){const result=spawnSync(process.execPath,[file],{encoding:'utf8'});console.log(`${result.status===0?'PASS':'FAIL'} ${file}`);if(result.status!==0){failed++;process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');}}
console.log(`${files.length-failed}/${files.length} test files passed. Provider calls in these tests use synthetic fixtures.`);
process.exitCode=failed?1:0;
