export function sampleOrders() {
  const customers = [
    'Casa del Norte',
    'Taller Roca',
    'Estudio Sur',
    'Mercado Alvear',
    'Cooperativa Horizonte',
    'Distrito Obras',
  ];
  const products = [
    { sku: 'MAT-100', description: 'Kit de fijación', price: 185000 },
    { sku: 'MAT-220', description: 'Perfil de aluminio', price: 432000 },
    { sku: 'MAT-315', description: 'Placa técnica', price: 795000 },
    { sku: 'MAT-410', description: 'Soporte regulable', price: 289000 },
  ];
  return Array.from({ length: 28 }, (_, index) => {
    const month = index < 8 ? '09' : '10';
    const day = index < 8 ? 10 + index * 2 : 1 + ((index - 8) % 20);
    const dueDay = Math.min(day + 7, 28);
    const state = index % 5;
    return {
      id: `PV-${1041 + index}`,
      customer: customers[index % 6],
      region: ['AMBA', 'Centro', 'Patagonia'][index % 3],
      date: `2026-${month}-${String(day).padStart(2, '0')}`,
      due: `2026-${month}-${String(dueDay).padStart(2, '0')}`,
      cancelled: index === 5 || index === 22,
      lines: Array.from({ length: (index % 3) + 1 }, (_, j) => {
        const product = products[(index + j) % 4];
        const quantity = 3 + ((index * 7 + j * 3) % 24);
        return {
          sku: product.sku,
          description: product.description,
          unitPriceCents: product.price,
          quantity,
          delivered:
            state === 0 || state === 1 ? quantity : state === 2 ? Math.floor(quantity / 2) : 0,
        };
      }),
    };
  });
}
