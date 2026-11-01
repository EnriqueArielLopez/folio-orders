import { status, amounts } from './domain.js';

export function createOrderBoard(openDetail) {
  const panel = document.querySelector('.orders-panel');
  const table = panel.querySelector('.table-wrap');
  const pagination = panel.querySelector('.pagination');
  const board = document.createElement('div');
  board.className = 'order-board';
  board.id = 'order-board';
  board.tabIndex = 0;
  board.setAttribute('role', 'region');
  board.setAttribute('aria-label', 'Pedidos por estado, desplazamiento horizontal');
  table.before(board);
  const insights = document.querySelector('.insights');
  if (insights) {
    const details = document.createElement('details');
    details.className = 'folio-insights';
    const summary = document.createElement('summary');
    summary.textContent = 'Ver evolución y avance de entregas';
    insights.before(details);
    details.append(summary, insights);
  }
  const switcher = document.createElement('div');
  switcher.className = 'view-switch';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', 'Vista de pedidos');
  switcher.innerHTML =
    '<button type="button" data-order-view="board" aria-pressed="true">Por estado</button><button type="button" data-order-view="list" aria-pressed="false">Lista</button>';
  panel.querySelector('.orders-heading').append(switcher);
  const shortcuts = document.createElement('div');
  shortcuts.className = 'status-shortcuts';
  shortcuts.setAttribute('role', 'group');
  shortcuts.setAttribute('aria-label', 'Filtrar pedidos por estado');
  [
    ['', 'Todos'],
    ['Pendiente', 'Pendientes'],
    ['Parcial', 'Parciales'],
    ['Entregado', 'Entregados'],
  ].forEach(([value, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.statusShortcut = value;
    button.textContent = label;
    button.setAttribute('aria-pressed', String(value === ''));
    button.addEventListener('click', () => {
      const select = document.querySelector('#status');
      select.value = value;
      select.dispatchEvent(new Event('input', { bubbles: true }));
    });
    shortcuts.append(button);
  });
  panel.querySelector('.filters').before(shortcuts);
  let view = matchMedia('(max-width: 680px)').matches ? 'board' : 'list',
    lastOpened;
  function applyView() {
    board.hidden = view !== 'board';
    table.hidden = view !== 'list';
    pagination.hidden = view !== 'list';
    switcher
      .querySelectorAll('button')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.orderView === view)),
      );
  }
  switcher.addEventListener('click', (event) => {
    const button = event.target.closest('[data-order-view]');
    if (button) {
      view = button.dataset.orderView;
      applyView();
    }
  });
  board.addEventListener('click', (event) => {
    const button = event.target.closest('[data-order]');
    if (button) {
      lastOpened = button.dataset.order;
      openDetail(lastOpened);
    }
  });
  document.querySelector('#detail').addEventListener('close', () => {
    if (lastOpened && !board.hidden)
      board
        .querySelector(`[data-order="${CSS.escape(lastOpened)}"]`)
        ?.focus({ preventScroll: true });
  });
  const money = (value) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value / 100);
  function text(tag, className, value) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = value;
    return element;
  }
  applyView();
  return function renderBoard(orders) {
    const fragment = document.createDocumentFragment();
    ['Pendiente', 'Parcial', 'Entregado', 'Cancelado'].forEach((state) => {
      const matches = orders.filter((order) => status(order) === state);
      const column = document.createElement('section');
      column.className = `board-column state-${state.toLowerCase()}`;
      const heading = document.createElement('h3');
      heading.append(text('span', '', state), text('span', 'board-count', String(matches.length)));
      column.append(heading);
      const cards = document.createElement('div');
      cards.className = 'board-cards';
      matches.forEach((order) => {
        const value = amounts(order),
          delivered = order.lines.reduce((n, line) => n + line.delivered, 0),
          quantity = order.lines.reduce((n, line) => n + line.quantity, 0);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'order-card';
        button.dataset.order = order.id;
        button.setAttribute('aria-label', `Ver pedido ${order.id}, ${order.customer}`);
        const top = document.createElement('span');
        top.className = 'order-card-top';
        top.append(
          text('strong', '', order.id),
          text('span', '', order.due.slice(8) + '/' + order.due.slice(5, 7)),
        );
        button.append(
          top,
          text('span', 'order-customer', order.customer),
          text('span', 'order-region', order.region),
          text('span', 'order-amount', money(value.total)),
          text('span', 'order-quantity', `${delivered} de ${quantity} unidades entregadas`),
        );
        const track = document.createElement('span');
        track.className = 'order-track';
        const fill = document.createElement('i');
        fill.style.width = `${quantity ? (delivered / quantity) * 100 : 0}%`;
        track.append(fill);
        button.append(track);
        cards.append(button);
      });
      if (!matches.length) cards.append(text('p', 'board-empty', 'Sin pedidos en este estado.'));
      column.append(cards);
      fragment.append(column);
    });
    board.replaceChildren(fragment);
  };
}
