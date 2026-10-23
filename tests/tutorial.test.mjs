import test from 'node:test';
import assert from 'node:assert/strict';
import {tutorialSnapshot} from '../src/tutorial-model.js';

test('el ejemplo de la guía empieza con 24 pedidas, 12 entregadas y 12 pendientes', () => {
  const frame = tutorialSnapshot();
  assert.equal(frame.requested, 24);
  assert.equal(frame.delivered, 12);
  assert.equal(frame.remaining, 12);
  assert.equal(frame.pendingCents, 3_000_000);
  assert.equal(frame.state, 'Parcial');
  assert.equal(frame.isOverdue, true);
});

test('simular 18 entregadas deja 6 y no cambia las escenas ni un ejemplo nuevo', () => {
  const before = tutorialSnapshot();
  const original = structuredClone(before);
  const after = tutorialSnapshot(18);
  assert.equal(after.remaining, 6);
  assert.equal(after.pendingCents, 1_500_000);
  assert.equal(after.progress, 75);
  assert.equal(after.state, 'Parcial');
  assert.deepEqual(before, original);
  after.order.lines[0].delivered = 0;
  assert.deepEqual(tutorialSnapshot(), original);
  assert.equal(tutorialSnapshot(24).state, 'Entregado');
});
