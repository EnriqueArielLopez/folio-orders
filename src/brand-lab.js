const lab = document.querySelector('.order-play');
if (lab) {
  const buttons = [...lab.querySelectorAll('[data-delivery]')];
  const blocks = [...lab.querySelectorAll('.delivery-track i')];
  const caption = lab.querySelector('.delivery-caption');
  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      const delivered = Number(button.dataset.delivery);
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      blocks.forEach((block, i) => block.classList.toggle('is-delivered', i < delivered / 4));
      caption.textContent = `${delivered} entregadas · ${24 - delivered} pendientes`;
      lab.closest('[data-brand-stage]').dataset.deliveryState =
        delivered === 24 ? 'complete' : 'pending';
    }),
  );
}
