import { amounts, CUTOFF, setDelivery, status, overdue } from './domain.js';

// The guide owns fresh fictional data. It never reads the app's orders or storage.
export function tutorialSnapshot(delivered = 12) {
  const order = {
    id: 'GUIA-024',
    customer: 'Taller Roca',
    region: 'AMBA',
    date: '2026-10-12',
    due: '2026-10-20',
    cancelled: false,
    lines: [
      {
        sku: 'SOP-01',
        description: 'Soporte regulable',
        quantity: 24,
        delivered: 12,
        unitPriceCents: 250000,
      },
    ],
  };
  const updated = setDelivery(order, [delivered]);
  const requested = updated.lines[0].quantity;
  return {
    order: updated,
    requested,
    delivered,
    remaining: requested - delivered,
    progress: Math.round((delivered / requested) * 100),
    pendingCents: amounts(updated).pending,
    state: status(updated),
    isOverdue: overdue(updated, CUTOFF),
    cutoff: CUTOFF,
  };
}
