import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {importOrders,summarize,HEADERS} from '../src/domain.js';
import {toCSV} from '../src/csv.js';
const python=process.env.LOTE_PYTHON||'python';
const root=new URL('..',import.meta.url);
function analyzeCSV(text){
  const input=new URL(`.sql-input-${randomUUID()}.csv`,import.meta.url);
  writeFileSync(input,text,{flag:'wx'});
  try{return spawnSync(python,['scripts/analyze_sql.py',fileURLToPath(input)],{cwd:root,encoding:'utf8'});}
  finally{unlinkSync(input);}
}
const base={pedido:'P1',cliente:'Cliente',region:'Centro',fecha:'2026-10-01',compromiso:'2026-10-02',material:'MAT-1',descripcion:'Material',cantidad:'1',precio_unitario:'1',entregado:'0'};
const csv=rows=>toCSV([...HEADERS,'cancelado'],rows.map(row=>({...base,cancelado:'0',...row})));
function rejects(rows,pattern){
  const text=csv(rows);assert.throws(()=>importOrders(text));
  const result=analyzeCSV(text);
  assert.equal(result.status,2,result.stderr);
  assert.equal(result.stdout,'');
  assert.match(result.stderr,pattern);
  assert.doesNotMatch(result.stderr,/Traceback|OverflowError/);
}
test('el resumen SQL coincide con la lógica JavaScript para el mismo CSV',()=>{
  const result=spawnSync(python,['scripts/analyze_sql.py','examples/pedidos.csv'],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const source=readFileSync(new URL('../examples/pedidos.csv',import.meta.url),'utf8');
  assert.deepEqual(JSON.parse(result.stdout),summarize(importOrders(source)));
});
test('SQL rechaza cantidades que antes producían importes de punto flotante',()=>{
  rejects([{cantidad:'9223372036854775807'}],/Cantidad fuera de rango/);
});
test('SQL rechaza precios con exponentes o fuera del formato admitido por la web',()=>{
  for(const precio_unitario of ['1e5','1000000000','0','1.234'])rejects([{precio_unitario}],/Precio|precio/);
});
test('SQL rechaza el desborde monetario de un pedido aunque cada línea sea segura',()=>{
  rejects([1,2,3].map(n=>({material:`MAT-${n}`,cantidad:'40000',precio_unitario:'999999999.99'})),/importe del pedido/);
});
test('SQL rechaza el desborde del lote aunque cada pedido sea seguro',()=>{
  rejects([1,2,3].map(n=>({pedido:`P${n}`,cantidad:'40000',precio_unitario:'999999999.99'})),/suma del lote/);
});
test('SQL mantiene la exclusión de cancelados al limitar la suma activa',()=>{
  const text=csv([1,2,3].map(n=>({pedido:`P${n}`,cantidad:'40000',precio_unitario:'999999999.99',cancelado:'1'})));
  const result=analyzeCSV(text);assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(result.stdout),summarize(importOrders(text)));
});
test('SQL trata comillas y contenido con sintaxis SQL como datos del cliente',()=>{
  const text=csv([{cliente:"'); DROP TABLE sales_order;--",descripcion:'Material con "comillas"; SELECT 1'}]);
  const result=analyzeCSV(text);assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(result.stdout),summarize(importOrders(text)));
});
test('SQL informa filas incompletas sin dejar un traceback',()=>{
  const result=analyzeCSV(HEADERS.join(',')+'\nP1,Cliente,Centro,2026-10-01,2026-10-02,MAT1,Material\n');
  assert.equal(result.status,2,result.stderr);
  assert.match(result.stderr,/cantidad de columnas/);
  assert.doesNotMatch(result.stderr,/Traceback/);
});
