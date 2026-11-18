import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(await readFile('dist/asset-manifest.json','utf8'));
const html=await readFile('dist/index.html','utf8');
for(const [source,path] of Object.entries(manifest)){
 const data=await readFile(`dist/${path}`);
 assert.ok(path.includes(createHash('sha256').update(data).digest('hex').slice(0,16)),`incorrect hash: ${source}`);
}
for(const [,path] of html.matchAll(/(?:src|href)="(assets\/[^"?]+)"/g))await readFile(`dist/${path}`);
const loader=await readFile(`dist/${manifest['twin-loader.js']}`,'utf8');
for(const name of ['three-twin.js','digital-twin.js','live-twin.js','digital-twin.css']){
 assert.ok(loader.includes(manifest[name]),`missing optional asset: ${name}`);
 assert.ok(!html.includes(manifest[name]),`eager optional asset: ${name}`);
}
assert.deepEqual(await readFile('dist/factory_layout_data.json'),await readFile('factory_layout_data.json'));
assert.ok(html.includes(manifest['app.js']));
console.log(`Production assets verified: ${Object.keys(manifest).length} hashed files, optional viewer deferred, layout unchanged.`);
