// Rebuild presentation metadata around the user's byte-preserved desktop export.
// No equipment, wall, column, route, mezzanine or custom-library transforms.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const raw=await readFile(new URL('../baselines/desktop-confirmed-20261022.json',import.meta.url));
const original=JSON.parse(raw),window={};
vm.runInNewContext(await readFile(new URL('../building-geometry.js',import.meta.url),'utf8'),{window});
const layout=window.ChinChunBuilding.apply(original);
const aisle=original.aisles.find(q=>q.id==='aisle_3');
if(!aisle || aisle.x!==86 || aisle.width!==3)throw new Error('Desktop corridor reference changed; review annotation before rebuilding.');
layout.building_geometry.connectingRamp={x:aisle.x,y:40,width:aisle.width,height:5,
  source:'已確認電腦版 aisle_3；黃線低端／紅線高端',geometryAccuracy:'corridor-aligned; run-estimate'};
layout.baseline_revision='desktop-confirmed-20261023';
layout.baseline_origin={file:'factory_layout_data_v2.json',exportedAt:'2026-10-22T15:21:37+07:00',confirmedAt:'2026-10-23',
  sha256:createHash('sha256').update(raw).digest('hex'),equipment:original.equipment.length,walls:original.walls.length};
for(const key of ['equipment','walls','columns','aisles','flows','equipment_2f','mezzanine_2f','layer_settings','grid']){
  if(JSON.stringify(layout[key])!==JSON.stringify(original[key]))throw new Error('Unexpected drawing edit: '+key);
}
await writeFile(new URL('../factory_layout_data.json',import.meta.url),JSON.stringify(layout,null,2)+'\n');
console.log(`Prepared confirmed desktop baseline: ${layout.equipment.length} equipment, ${layout.walls.length} walls; drawing geometry unchanged.`);
