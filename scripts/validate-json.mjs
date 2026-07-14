import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
async function* walk(dir){ for (const e of await readdir(dir,{withFileTypes:true})){ const p=join(dir,e.name); if(e.isDirectory() && !['.git','node_modules'].includes(e.name)) yield* walk(p); else if(e.isFile() && e.name.endsWith('.json')) yield p; }}
for await (const file of walk('.')) JSON.parse(await readFile(file,'utf8'));
console.log('JSON validation passed');
