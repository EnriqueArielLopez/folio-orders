import {tutorialSnapshot} from './tutorial-model.js';

const $ = selector => document.querySelector(selector);
const guide = $('#folio-guide');
const before = tutorialSnapshot();
const after = tutorialSnapshot(18);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = cents => new Intl.NumberFormat('es-AR', {style:'currency', currency:'ARS', maximumFractionDigits:0}).format(cents / 100);
const date = value => new Intl.DateTimeFormat('es-AR', {day:'numeric', month:'short', timeZone:'UTC'}).format(new Date(value + 'T00:00:00Z'));
const parcel = '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="m10 20 22-12 22 12v26L32 58 10 46Z"/><path d="m10 20 22 13 22-13M32 33v25M21 14l22 13v11"/></svg>';
const fileIcon = '<svg viewBox="0 0 40 48" fill="none" aria-hidden="true"><path d="M7 3h18l9 10v32H7Z"/><path d="M24 3v11h10M13 24h15M13 31h15M13 38h10"/></svg>';
function orderCard(frame, emphasis = '') {
  return `<div class="guide-order ${emphasis}"><div class="guide-order-head"><span>${escape(frame.order.id)} · ${escape(frame.order.customer)}</span><span class="guide-chip">${escape(frame.state)}</span></div><div class="guide-product">${parcel}<div><strong>24 soportes regulables</strong><small>Un pedido, una entrega que podés completar en partes.</small></div></div><dl class="guide-quantities"><div><dt>Pedidas</dt><dd>${frame.requested}</dd></div><div><dt>Entregadas</dt><dd>${frame.delivered}</dd></div><div><dt>Faltan</dt><dd>${frame.remaining}</dd></div></dl><div class="guide-delivery-track"><i style="width:${frame.progress}%"></i></div><p class="guide-order-note">${frame.progress}% de las unidades entregadas</p></div>`;
}
const scenes = [
  {
    title: 'Sabé qué falta entregar.',
    copy: 'Folio sirve para quienes venden, administran pedidos o preparan entregas. Taller Roca pidió 24 soportes: ya recibió 12 y todavía espera 12. El pedido queda abierto hasta completar la entrega.',
    action: 'La planilla te dice qué pidieron. Folio te ayuda a seguir qué falta.',
    visual: () => orderCard(before),
  },
  {
    title: 'Abrí la ficha del pedido.',
    copy: 'En la tabla, buscá el cliente o el número de pedido. La flecha ↗ al final de la fila abre su ficha: ahí aparecen los productos, las cantidades pedidas y lo que ya entregaste.',
    action: 'En tu tabla: buscá el pedido y pulsá ↗.',
    visual: () => `<div class="guide-table-label">PEDIDOS / FILA DE EJEMPLO</div><div class="guide-example-row"><div><strong>GUIA-024</strong><small>Taller Roca · 24 soportes</small></div><span class="guide-chip">Parcial</span><span class="guide-fake-open" aria-hidden="true">↗</span></div><div class="guide-connector" aria-hidden="true">↓</div>${orderCard(before, 'guide-highlight')}`,
  },
  {
    title: 'Hoy entregás 6 más: escribí 18.',
    copy: 'La ficha pide la cantidad acumulada. Si ya entregaste 12 y hoy salen otras 6, escribí 18 en “Entregado de 24” y elegí “Guardar entrega”. Escribir 6 reemplazaría el acumulado anterior por 6.',
    action: '12 anteriores + 6 nuevas = 18 entregadas en total.',
    visual: () => `<div class="guide-demo-form"><div class="guide-table-label">FICHA / GUIA-024</div><h4>Soporte regulable</h4><p>Pedido: 24 unidades · Ya entregadas: 12</p><div class="guide-input-label">Entregado de 24</div><div class="guide-demo-input"><span class="guide-old-value">12</span><span aria-hidden="true">→</span><output>18</output><span class="guide-input-caret" aria-hidden="true"></span></div><div class="guide-form-equation"><span>12 anteriores</span><b>+</b><span>6 nuevas</span><b>=</b><strong>18 acumuladas</strong></div><span class="guide-fake-save">Guardar entrega <span aria-hidden="true">✓</span></span></div>`,
  },
  {
    title: 'Ahora faltan 6. Todo se recalcula.',
    copy: 'El pedido sigue “Parcial” porque 24 menos 18 deja 6 unidades pendientes. Los indicadores se actualizan al guardar. “Por entregar” muestra el valor de esas unidades: 6 × $ 2.500 = $ 15.000. Es mercadería pendiente, no una deuda del cliente.',
    action: 'Cuando el acumulado llegue a 24, el estado pasa a “Entregado”.',
    visual: () => `<div class="guide-comparison"><div><span>ANTES</span><strong>${before.remaining}</strong><small>unidades pendientes</small></div><span class="guide-result-arrow" aria-hidden="true">→</span><div class="guide-result"><span>DESPUÉS DE GUARDAR</span><strong>${after.remaining}</strong><small>unidades pendientes</small></div></div>${orderCard(after, 'guide-updated')}<div class="guide-money-result"><span>Por entregar</span><strong>${escape(money(after.pendingCents))}</strong></div>`,
  },
  {
    title: 'Primero, lo que ya se venció.',
    copy: 'Usá “Fuera de compromiso” para ver pedidos que todavía tienen una entrega pendiente y cuya fecha prometida ya pasó. También podés filtrar por cliente, estado, región o fechas. “Limpiar” devuelve la vista completa.',
    action: `En esta guía se prometió para el ${date(after.order.due)} y el corte es el ${date(after.cutoff)}. Todavía faltan 6.`,
    visual: () => `<div class="guide-filter-demo"><span>FILTRO ACTIVADO</span><strong>Fuera de compromiso <span aria-hidden="true">↗</span></strong><small>Solo pedidos con entregas pendientes y una fecha prometida anterior al corte.</small></div><div class="guide-due-dates"><div><small>Fecha prometida</small><strong>${escape(date(after.order.due))}</strong></div><span aria-hidden="true">→</span><div><small>Corte de análisis</small><strong>${escape(date(after.cutoff))}</strong></div></div><div class="guide-example-row guide-overdue-row"><div><strong>GUIA-024 · Taller Roca</strong><small>Faltan ${after.remaining} soportes</small></div><span class="guide-late-chip">Compromiso vencido</span></div><p class="guide-stage-footnote">El corte de esta demo está fijado en el 22/10/2026.</p>`,
  },
  {
    title: 'Entrá con una planilla. Salí con tu listado.',
    copy: 'CSV es una planilla guardada como texto. “Importar CSV” carga los pedidos de ese archivo y reemplaza los de este navegador; si hay un error, conserva los anteriores. “Exportar vista” descarga todos los pedidos que coinciden con tus filtros, incluidas las otras páginas.',
    action: 'Para probar la app sin preparar nada, cerrá esta guía y usá los pedidos de ejemplo.',
    visual: () => `<div class="guide-file-flow"><div class="guide-file-card">${fileIcon}<strong>pedidos.csv</strong><span>Tu planilla de entrada</span></div><span class="guide-flow-arrow" aria-hidden="true">→</span><div class="guide-file-card guide-file-center">${parcel}<strong>Folio</strong><span>Registrá entregas<br>y filtrá pendientes</span></div><span class="guide-flow-arrow" aria-hidden="true">→</span><div class="guide-file-card">${fileIcon}<strong>folio-pedidos.csv</strong><span>La selección que necesitás</span></div></div><div class="guide-csv-preview"><span>EL ARCHIVO INCLUYE</span><p>Pedido · Cliente · Material · Cantidad · Entregado</p></div><p class="guide-stage-footnote">La guía no importa, descarga ni modifica archivos. Todo lo que viste fue una simulación.</p>`,
  },
];

let index = 0;
let playing = false;
let timer;
let trigger;
let previousOverflow = '';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function renderScene() {
  const scene = scenes[index];
  $('#guide-step-count').textContent = `PASO ${index + 1} DE ${scenes.length}`;
  $('#guide-scene-title').textContent = scene.title;
  $('#guide-scene-copy').textContent = scene.copy;
  $('#guide-scene-action').textContent = scene.action;
  $('#guide-stage').dataset.scene = String(index);
  $('#guide-stage').innerHTML = scene.visual();
  $('#guide-progress').value = index + 1;
  $('#guide-previous').disabled = index === 0;
  $('#guide-next').textContent = index === scenes.length - 1 ? 'Terminar guía ✓' : 'Siguiente →';
  $('#guide-status').textContent = `Paso ${index + 1} de ${scenes.length}. ${scene.title}`;
  updatePlayback();
  guide.scrollTop = 0;
}
function updatePlayback() {
  $('#guide-play').textContent = playing ? 'Ⅱ Pausar guía' : index === scenes.length - 1 ? '▶ Reproducir de nuevo' : '▶ Reproducir guía';
  $('#guide-play').setAttribute('aria-pressed', String(playing));
  $('#guide-playback-note').textContent = playing ? 'Avanza cada 12 segundos. Podés pausar cuando quieras.' : 'Avanzá a tu ritmo o elegí Reproducir guía.';
  guide.classList.toggle('guide-playing', playing);
}
function pause() {
  clearTimeout(timer);
  playing = false;
  updatePlayback();
}
function scheduleNext() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (!guide.open || !playing) return;
    if (index < scenes.length - 1) { index++; renderScene(); }
    if (index === scenes.length - 1) pause(); else scheduleNext();
  }, 12000);
}
function openGuide() {
  if (guide.open) return;
  trigger = document.activeElement?.matches('#guide-open') ? document.activeElement : $('#guide-open');
  previousOverflow = document.documentElement.style.overflow;
  index = 0;
  pause();
  renderScene();
  guide.showModal();
  guide.scrollTop = 0;
  document.documentElement.style.overflow = 'hidden';
  $('#guide-title').focus({preventScroll:true});
}
$('#guide-open').addEventListener('click', openGuide);
$('#guide-close').addEventListener('click', () => guide.close());
$('#guide-previous').addEventListener('click', () => { pause(); if (index > 0) index--; renderScene(); if (index === 0) $('#guide-next').focus({preventScroll:true}); });
$('#guide-next').addEventListener('click', () => { pause(); if (index === scenes.length - 1) guide.close(); else { index++; renderScene(); } });
$('#guide-restart').addEventListener('click', () => { pause(); index = 0; renderScene(); });
$('#guide-play').addEventListener('click', () => {
  if (playing) { pause(); return; }
  if (index === scenes.length - 1) { index = 0; renderScene(); }
  playing = true;
  updatePlayback();
  scheduleNext();
});
guide.addEventListener('close', () => {
  pause();
  document.documentElement.style.overflow = previousOverflow;
  if (trigger?.isConnected) trigger.focus({preventScroll:true});
});
guide.addEventListener('click', event => {
  if (event.target !== guide) return;
  const bounds = guide.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) guide.close();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) pause(); });
if (new URLSearchParams(location.search).get('tutorial') === '1') openGuide();
