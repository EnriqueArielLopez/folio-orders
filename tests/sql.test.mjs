import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {importOrders,summarize} from '../src/domain.js';
test('el resumen SQL coincide con la lógica JavaScript para el mismo CSV',()=>{
  const result=spawnSync(process.env.LOTE_PYTHON||'python',['scripts/analyze_sql.py','examples/pedidos.csv'],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const csv=readFileSync(new URL('../examples/pedidos.csv',import.meta.url),'utf8');
  assert.deepEqual(JSON.parse(result.stdout),summarize(importOrders(csv)));
});
