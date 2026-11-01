const reduced = matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-brand-stage]').forEach((stage) => {
  const toggle = stage.querySelector('[data-brand-motion]');
  let paused = false;
  let visible = true;
  function render() {
    const stopped = paused || reduced.matches;
    stage.dataset.animate = !stopped && visible && !document.hidden ? 'on' : 'off';
    toggle.disabled = reduced.matches;
    toggle.setAttribute('aria-pressed', String(stopped));
    toggle.textContent = reduced.matches
      ? 'Movimiento reducido'
      : paused
        ? 'Animar dibujo'
        : 'Pausar dibujo';
  }
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    paused = !paused;
    render();
  });
  reduced.addEventListener('change', render);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      render();
    }).observe(stage);
  }
  document.addEventListener('visibilitychange', () => {
    render();
  });
  render();
});
