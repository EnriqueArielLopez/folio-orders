import { parseCSV, toCSV } from './csv.js';
export const CUTOFF = '2026-10-22';
export const HEADERS = [
  'pedido',
  'cliente',
  'region',
  'fecha',
  'compromiso',
  'material',
  'descripcion',
  'cantidad',
  'precio_unitario',
  'entregado',
];
export function moneyToCents(value) {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(String(value)) || /[\r\n]/.test(String(value)))
    throw new Error('El precio debe ser positivo, sin miles y con hasta dos decimales.');
  const [whole, decimal = ''] = String(value).split('.');
  return Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
}
export function validDate(value) {
  return (
    /^(20\d{2}|2100)-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function amounts(order) {
  const total = order.lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
  const delivered = order.lines.reduce(
    (sum, line) => sum + line.delivered * line.unitPriceCents,
    0,
  );
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(delivered))
    throw new Error('El importe excede el rango seguro.');
  return { total, delivered, pending: total - delivered };
}
export function status(order) {
  if (order.cancelled) return 'Cancelado';
  const quantity = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const delivered = order.lines.reduce((sum, line) => sum + line.delivered, 0);
  return delivered === 0 ? 'Pendiente' : delivered === quantity ? 'Entregado' : 'Parcial';
}
export function overdue(order, cutoff = CUTOFF) {
  return !order.cancelled && order.due < cutoff && amounts(order).pending > 0;
}
export function filterOrders(orders, filters = {}) {
  const needle = (filters.search || '').trim().toLocaleLowerCase('es');
  return orders.filter(
    (order) =>
      (!filters.region || order.region === filters.region) &&
      (!filters.status || status(order) === filters.status) &&
      (!filters.from || order.date >= filters.from) &&
      (!filters.to || order.date <= filters.to) &&
      (!filters.overdue || overdue(order)) &&
      (!needle || `${order.id} ${order.customer}`.toLocaleLowerCase('es').includes(needle)),
  );
}
export function summarize(orders) {
  const active = orders.filter((order) => !order.cancelled);
  const result = {
    count: active.length,
    booked: active.reduce((sum, order) => sum + amounts(order).total, 0),
    pending: active.reduce((sum, order) => sum + amounts(order).pending, 0),
    overdue: active.filter((order) => overdue(order)).length,
  };
  if (!Number.isSafeInteger(result.booked) || !Number.isSafeInteger(result.pending))
    throw new Error('La suma del lote excede el rango monetario seguro.');
  return result;
}
export function importOrders(text) {
  const parsed = parseCSV(text);
  if (HEADERS.some((header) => !parsed.headers.includes(header)))
    throw new Error('La cabecera no coincide con la plantilla de Folio.');
  const map = new Map();
  parsed.rows.forEach((raw, index) => {
    const row = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value.trim()]));
    const fail = (message) => {
      throw new Error(`Fila ${index + 2}: ${message}`);
    };
    if (
      !/^[A-Za-z0-9][\w-]{0,23}$/.test(row.pedido) ||
      !row.cliente ||
      row.cliente.length > 100 ||
      !row.region ||
      row.region.length > 40 ||
      !row.material ||
      !row.descripcion
    )
      fail('faltan datos o hay identificadores inválidos.');
    if (row.cancelado !== undefined && !['0', '1'].includes(row.cancelado))
      fail('cancelado solo acepta 0 o 1.');
    if (!validDate(row.fecha) || !validDate(row.compromiso) || row.compromiso < row.fecha)
      fail('fechas inválidas o compromiso anterior al pedido.');
    if (!/^\d+$/.test(row.cantidad) || !/^\d+$/.test(row.entregado))
      fail('las cantidades deben ser enteras.');
    const quantity = Number(row.cantidad),
      delivered = Number(row.entregado);
    if (quantity < 1 || quantity > 100000 || delivered > quantity)
      fail('cantidad fuera de rango o entrega mayor al pedido.');
    let unitPriceCents;
    try {
      unitPriceCents = moneyToCents(row.precio_unitario);
    } catch (error) {
      fail(error.message);
    }
    if (unitPriceCents === 0) fail('el precio debe ser mayor a cero.');
    const metadata = {
      id: row.pedido,
      customer: row.cliente,
      region: row.region,
      date: row.fecha,
      due: row.compromiso,
      cancelled: row.cancelado === '1',
    };
    if (!map.has(row.pedido)) map.set(row.pedido, { ...metadata, lines: [] });
    const order = map.get(row.pedido);
    if (Object.keys(metadata).some((key) => order[key] !== metadata[key]))
      fail('las filas del mismo pedido tienen cabeceras diferentes.');
    if (order.lines.some((line) => line.sku === row.material))
      fail('material repetido en el pedido.');
    order.lines.push({
      sku: row.material,
      description: row.descripcion.slice(0, 200),
      quantity,
      delivered,
      unitPriceCents,
    });
    amounts(order);
  });
  const result = [...map.values()];
  const dates = result.map((order) => Date.parse(order.date));
  if (Math.max(...dates) - Math.min(...dates) > 366 * 86400000)
    throw new Error('El lote debe abarcar como máximo un año de pedidos.');
  summarize(result);
  return result;
}
export function exportOrders(orders) {
  return toCSV(
    [...HEADERS, 'cancelado'],
    orders.flatMap((order) =>
      order.lines.map((line) => ({
        pedido: order.id,
        cliente: order.customer,
        region: order.region,
        fecha: order.date,
        compromiso: order.due,
        material: line.sku,
        descripcion: line.description,
        cantidad: line.quantity,
        precio_unitario: (line.unitPriceCents / 100).toFixed(2),
        entregado: line.delivered,
        cancelado: order.cancelled ? '1' : '0',
      })),
    ),
  );
}
export function setDelivery(order, quantities) {
  if (order.cancelled) throw new Error('Reactivá el pedido antes de registrar una entrega.');
  if (
    quantities.length !== order.lines.length ||
    quantities.some(
      (value, index) =>
        !Number.isInteger(value) || value < 0 || value > order.lines[index].quantity,
    )
  )
    throw new Error('Cada entrega debe estar entre cero y la cantidad pedida.');
  return {
    ...order,
    lines: order.lines.map((line, index) => ({ ...line, delivered: quantities[index] })),
  };
}
