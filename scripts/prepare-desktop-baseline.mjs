// Rebuild presentation metadata around the user's byte-preserved desktop export.
// No equipment, wall, column, route, mezzanine or custom-library transforms.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const raw=await readFile(new URL('../baselines/desktop-confirmed-20261022.json',import.meta.url));
const original=JSON.parse(raw),window={};
const cuttingAccessories=[
  {x:1.1,y:.55,id:'eq_cutting_office_desk',code:'DESK-CUT',name:'裁切分條部門辦公桌',zone:'裁切分條部門',color:'#8B5E3C',floor:'1F',width:2.4,height:1.9,category:'Office',rotation:0,
    geometryAccuracy:'PDF-arrow/photo-estimate'},
  {x:7.95,y:.55,id:'eq_cutting_bench_grinder',code:'GRINDER-CUT',name:'裁切分條部門砂輪機',zone:'裁切分條部門',color:'#8A6A58',floor:'1F',width:1.1,height:.9,category:'Tool',rotation:0,
    geometryAccuracy:'PDF-arrow/photo-estimate'}
];
vm.runInNewContext(await readFile(new URL('../building-geometry.js',import.meta.url),'utf8'),{window});
const layout=window.ChinChunBuilding.apply(original);
const aisle=original.aisles.find(q=>q.id==='aisle_3');
if(!aisle || aisle.x!==86 || aisle.width!==3)throw new Error('Desktop corridor reference changed; review annotation before rebuilding.');
layout.building_geometry.connectingRamp={x:aisle.x,y:40,width:aisle.width,height:5,
  source:'已確認電腦版 aisle_3；黃線低端／紅線高端',geometryAccuracy:'corridor-aligned; run-estimate'};
for(const accessory of cuttingAccessories)layout.equipment.push(accessory);
layout.source_geometry_revision='2026-layout-for-ai-eps-v1.2-r3-cutting-accessories';
layout.baseline_revision='desktop-confirmed-20261103';
layout.baseline_origin={file:'factory_layout_data_v2.json',exportedAt:'2026-10-22T15:21:37+07:00',confirmedAt:'2026-10-23',
  sha256:createHash('sha256').update(raw).digest('hex'),equipment:original.equipment.length,walls:original.walls.length};
for(const key of ['walls','columns','aisles','flows','equipment_2f','mezzanine_2f','layer_settings','grid']){
  if(JSON.stringify(layout[key])!==JSON.stringify(original[key]))throw new Error('Unexpected drawing edit: '+key);
}
if(JSON.stringify(layout.equipment.slice(0,original.equipment.length))!==JSON.stringify(original.equipment))throw new Error('Existing equipment changed while adding cutting accessories.');
if(JSON.stringify(layout.equipment.slice(original.equipment.length))!==JSON.stringify(cuttingAccessories))throw new Error('Cutting accessories were not appended exactly once.');
await writeFile(new URL('../factory_layout_data.json',import.meta.url),JSON.stringify(layout,null,2)+'\n');
console.log(`Prepared confirmed desktop baseline: ${layout.equipment.length} equipment, ${layout.walls.length} walls; drawing geometry unchanged.`);
