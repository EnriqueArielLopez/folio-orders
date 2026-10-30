import { icon } from './icons.js';
import {
  CUTOFF,
  amounts,
  status,
  overdue,
  filterOrders,
  summarize,
  importOrders,
  exportOrders,
  setDelivery,
} from './domain.js';
import { sampleOrders } from './sample.js';
import { initWorkspace } from './workspace.js';
initWorkspace();
const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const money = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value / 100);
const compact = (value) =>
  new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value / 100,
  );
const date = (value) =>
  new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(
    new Date(value + 'T00:00:00Z'),
  );
let sourceLabel = 'Datos de ejemplo';
let orders = sampleOrders(),
  page = 1,
  sort = 'id-desc',
  overdueOnly = false,
  selectedId;
const PAGE_SIZE = 8,
  STORAGE_KEY = 'folio-orders-v1';
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    orders = importOrders(saved);
    sourceLabel = 'Sesión local recuperada';
  }
} catch {
  toast('No se pudo recuperar la sesión. Se cargó el ejemplo.');
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, exportOrders(orders));
  } catch {
    toast('Cambios en memoria. El navegador no permite guardarlos; podés exportarlos.');
  }
}
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('#toast').classList.remove('visible'), 4500);
}
function populateRegions() {
  const value = $('#region').value;
  $('#region').innerHTML =
    '<option value="">Todas las regiones</option>' +
    [...new Set(orders.map((order) => order.region))]
      .sort()
      .map((region) => `<option>${escape(region)}</option>`)
      .join('');
  if ([...$('#region').options].some((option) => option.value === value))
    $('#region').value = value;
}
function visibleOrders() {
  const filtered = filterOrders(orders, {
    search: $('#search').value,
    status: $('#status').value,
    region: $('#region').value,
    from: $('#from').value,
    to: $('#to').value,
    overdue: overdueOnly,
  });
  return filtered.sort((a, b) =>
    sort === 'value-desc'
      ? amounts(b).total - amounts(a).total
      : sort === 'id-asc'
        ? a.id.localeCompare(b.id)
        : b.id.localeCompare(a.id),
  );
}
function renderChart(list) {
  const active = list.filter((order) => !order.cancelled);
  const timestamps = active.map((order) => Date.parse(order.date));
  const monthly =
    active.length && Math.max(...timestamps) - Math.min(...timestamps) > 90 * 86400000;
  const buckets = new Map();
  for (const order of active) {
    const start = new Date(order.date + 'T00:00:00Z');
    if (monthly) start.setUTCDate(1);
    else start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    const key = start.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) || 0) + amounts(order).total);
  }
  const sorted = [...buckets.keys()].sort();
  if (sorted.length) {
    const cursor = new Date(sorted[0] + 'T00:00:00Z');
    while (cursor.toISOString().slice(0, 10) <= sorted.at(-1)) {
      const key = cursor.toISOString().slice(0, 10);
      if (!buckets.has(key)) buckets.set(key, 0);
      if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      else cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
  }
  const entries = [...buckets].sort(([a], [b]) => a.localeCompare(b));
  const label = (value) =>
    monthly
      ? new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'UTC' }).format(
          new Date(value + 'T00:00:00Z'),
        )
      : date(value);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  $('.chart-panel .panel-heading p').textContent = monthly
    ? 'Valor neto por mes de alta'
    : 'Valor neto por semana de alta';
  $('#chart').innerHTML = entries.length
    ? entries
        .map(
          ([key, value], index) =>
            `<div class="bar-group" title="${escape(label(key))}: ${escape(money(value))}"><span class="bar-value">${compact(value)}</span><div class="bar" style="height:${Math.max(0, (value / max) * 95)}px"></div><span class="bar-label">${entries.length > 9 && index % 2 ? '' : escape(label(key))}</span></div>`,
        )
        .join('')
    : '<p class="subtitle">Sin pedidos activos para graficar.</p>';
  $('#chart').setAttribute(
    'aria-label',
    entries.length
      ? entries.map(([key, value]) => `${label(key)}: ${money(value)}`).join('. ')
      : 'Sin datos para el gráfico',
  );
}
function render() {
  $('.context-bar>span:first-child').innerHTML =
    '<i></i> ' + escape(sourceLabel) + ' · ARS · Sin IVA';
  const invalidDates = $('#from').value && $('#to').value && $('#from').value > $('#to').value;
  $('#filter-error').hidden = !invalidDates;
  $('#filter-error').textContent = 'La fecha inicial debe ser anterior o igual a la final.';
  const list = invalidDates ? [] : visibleOrders();
  const totals = summarize(list);
  $('#metric-booked').textContent = money(totals.booked);
  $('#metric-pending').textContent = money(totals.pending);
  $('#metric-count').textContent = totals.count;
  $('#metric-overdue').textContent = totals.overdue;
  $('#overdue-button').setAttribute('aria-pressed', String(overdueOnly));
  $('#active-filter').hidden = !overdueOnly;
  const pct = totals.booked
    ? Math.round(((totals.booked - totals.pending) / totals.booked) * 100)
    : 0;
  $('#delivery-percent').textContent = `${pct}%`;
  $('#delivery-bar').style.width = pct + '%';
  $('#delivery-description').textContent =
    `${money(totals.booked - totals.pending)} entregados de ${money(totals.booked)} en pedidos activos.`;
  renderChart(list);
  $('.nav i').textContent = orders.length;
  $('#result-count').textContent = list.length;
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  page = Math.min(page, pages);
  $('#orders-body').innerHTML = list
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((order) => {
      const value = amounts(order),
        state = status(order),
        progress = value.total ? Math.round((value.delivered / value.total) * 100) : 0;
      return `<tr><td><strong>${escape(order.id)}</strong><small>${escape(date(order.date))}</small></td><td><strong>${escape(order.customer)}</strong><small>${escape(order.region)}</small></td><td><span class="${overdue(order) ? 'late' : ''}">${escape(date(order.due))}</span>${overdue(order) ? '<small class="late">Compromiso vencido</small>' : ''}</td><td class="numeric">${escape(money(value.total))}</td><td>${progress}%<div class="mini-progress"><i style="width:${progress}%"></i></div></td><td><span class="status ${state.toLowerCase()}">${state}</span></td><td><button class="view-order" data-order="${escape(order.id)}" aria-label="Ver pedido ${escape(order.id)}">${icon('arrow-up-right')}</button></td></tr>`;
    })
    .join('');
  $('#empty').hidden = !!list.length;
  $('#page-label').textContent = list.length
    ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, list.length)} de ${list.length} pedidos`
    : '0 pedidos';
  $('#previous').disabled = page === 1;
  $('#next').disabled = page === pages;
  $('#export-button').disabled = !list.length;
  $('#sort-order').innerHTML =
    `Pedido ${icon(sort === 'id-asc' ? 'arrow-up' : sort === 'id-desc' ? 'arrow-down' : 'sort')}`;
  $('#sort-value').innerHTML = `Valor neto ${icon(sort === 'value-desc' ? 'arrow-down' : 'sort')}`;
  $('#sort-order')
    .closest('th')
    .setAttribute(
      'aria-sort',
      sort === 'id-asc' ? 'ascending' : sort === 'id-desc' ? 'descending' : 'none',
    );
  $('#sort-value')
    .closest('th')
    .setAttribute('aria-sort', sort === 'value-desc' ? 'descending' : 'none');
}
function openDetail(id) {
  const order = orders.find((order) => order.id === id);
  if (!order) return;
  selectedId = id;
  const value = amounts(order);
  $('#detail-content').innerHTML =
    `<h2 id="detail-title">${escape(order.id)}</h2><p class="subtitle">${escape(order.customer)} · ${escape(order.region)}</p><span class="status ${status(order).toLowerCase()}">${status(order)}</span><div class="detail-info"><div><small>Fecha de alta</small><strong>${date(order.date)}</strong></div><div><small>Compromiso</small><strong>${date(order.due)}</strong></div><div><small>Valor neto</small><strong>${money(value.total)}</strong></div></div><p class="subtitle">Registrá la cantidad acumulada entregada por material. Los importes se recalculan al guardar.</p><form id="delivery-form"><div class="detail-lines">${order.lines.map((line, index) => `<div class="detail-line"><div><p>${escape(line.description)}</p><small>${escape(line.sku)} · ${line.quantity} un. × ${money(line.unitPriceCents)}</small></div><label>Entregado de ${line.quantity}<input aria-label="Entrega acumulada ${escape(line.sku)}" name="delivery-${index}" type="number" min="0" max="${line.quantity}" step="1" required value="${line.delivered}" ${order.cancelled ? 'disabled' : ''}></label></div>`).join('')}</div><p id="detail-error" role="alert" class="error" hidden></p><div class="detail-actions"><button type="button" class="quiet" id="cancel-order">${order.cancelled ? 'Reactivar pedido' : 'Cancelar pedido'}</button><button class="button primary" ${order.cancelled ? 'disabled' : ''}>Guardar entrega</button></div></form>`;
  if (!$('#detail').open) {
    $('#detail').showModal();
    document.documentElement.style.overflow = 'hidden';
  }
}
$('#orders-body').addEventListener('click', (event) => {
  const button = event.target.closest('[data-order]');
  if (button) openDetail(button.dataset.order);
});
$('#detail-content').addEventListener('submit', (event) => {
  event.preventDefault();
  const order = orders.find((order) => order.id === selectedId);
  try {
    const quantities = order.lines.map((_, i) =>
      Number(event.target.elements[`delivery-${i}`].value),
    );
    const updated = setDelivery(order, quantities);
    orders = orders.map((item) => (item.id === updated.id ? updated : item));
    persist();
    render();
    $('#detail').close();
    toast('Entrega registrada. Los indicadores están actualizados.');
  } catch (error) {
    $('#detail-error').hidden = false;
    $('#detail-error').textContent = error.message;
  }
});
$('#detail-content').addEventListener('click', (event) => {
  if (event.target.id !== 'cancel-order') return;
  orders = orders.map((order) =>
    order.id === selectedId ? { ...order, cancelled: !order.cancelled } : order,
  );
  persist();
  render();
  openDetail(selectedId);
  $('#cancel-order').focus({ preventScroll: true });
  toast('Estado del pedido actualizado.');
});
$('#close-detail').addEventListener('click', () => $('#detail').close());
function restoreDetailFocus() {
  document.documentElement.style.overflow = '';
  // render() recreates the row buttons; find the current one by its literal ID.
  const button = [...$('#orders-body').querySelectorAll('[data-order]')].find(
    (item) => item.dataset.order === selectedId,
  );
  (button || $('#orders-title')).focus({ preventScroll: true });
}
$('#detail').addEventListener('close', restoreDetailFocus);
$('#detail').addEventListener('click', (event) => {
  if (event.target === $('#detail')) {
    const r = event.target.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      event.target.close();
  }
});
$('#filters').addEventListener('submit', (event) => event.preventDefault());
$('#filters').addEventListener('input', () => {
  page = 1;
  render();
});
$('#clear-filters').addEventListener('click', () => {
  $('#filters').reset();
  overdueOnly = false;
  page = 1;
  render();
});
$('#overdue-button').addEventListener('click', () => {
  overdueOnly = !overdueOnly;
  page = 1;
  render();
  $('#orders-title').scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  });
});
$('#remove-overdue').addEventListener('click', () => {
  overdueOnly = false;
  page = 1;
  render();
});
$('#sort-order').addEventListener('click', () => {
  sort = sort === 'id-desc' ? 'id-asc' : 'id-desc';
  page = 1;
  render();
});
$('#sort-value').addEventListener('click', () => {
  sort = 'value-desc';
  page = 1;
  render();
});
$('#previous').addEventListener('click', () => {
  page--;
  render();
});
$('#next').addEventListener('click', () => {
  page++;
  render();
});
function download(contents, name) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('#export-button').addEventListener('click', () => {
  download(exportOrders(visibleOrders()), 'folio-pedidos.csv');
  toast('Se exportó la selección actual.');
});
$('#import-button').addEventListener('click', () => $('#file').click());
$('#file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('El archivo supera 2 MB.');
    const imported = importOrders(await file.text());
    orders = imported;
    sourceLabel = file.name;
    $('#filters').reset();
    overdueOnly = false;
    page = 1;
    populateRegions();
    persist();
    render();
    toast(
      `${orders.length} pedidos importados. Los datos anteriores se reemplazaron en este navegador.`,
    );
  } catch (error) {
    toast(error.message);
  } finally {
    event.target.value = '';
  }
});
$('#reset-button').addEventListener('click', () => {
  orders = sampleOrders();
  sourceLabel = 'Datos de ejemplo';
  $('#filters').reset();
  overdueOnly = false;
  page = 1;
  populateRegions();
  persist();
  render();
  toast('Ejemplo restaurado.');
});
populateRegions();
render();
