export function enhanceDeliveryControls(container) {
  container.querySelectorAll('.detail-line').forEach((line) => {
    const input = line.querySelector('input[type=number]');
    if (!input || input.disabled) return;
    const controls = document.createElement('div');
    controls.className = 'delivery-shortcuts';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', `Preparar entrega: ${input.getAttribute('aria-label')}`);
    const output = document.createElement('p');
    output.className = 'delivery-draft';
    output.setAttribute('aria-live', 'polite');
    const update = () => {
      const value = input.valueAsNumber,
        maximum = Number(input.max);
      output.textContent =
        Number.isInteger(value) && value >= 0 && value <= maximum
          ? `${value} entregadas · ${maximum - value} pendientes. Se aplica al guardar.`
          : 'Ingresá una cantidad entera dentro del pedido.';
      controls.querySelectorAll('button').forEach((button) => {
        button.disabled = Number.isFinite(value) && value >= maximum;
      });
    };
    [
      ['+1', 1],
      ['+6', 6],
      ['Completar', null],
    ].forEach(([label, step]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => {
        const value = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : 0;
        input.value = String(
          step === null
            ? Number(input.max)
            : Math.min(Number(input.max), Math.max(0, value) + step),
        );
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      controls.append(button);
    });
    input.addEventListener('input', update);
    line.append(controls, output);
    update();
  });
}
