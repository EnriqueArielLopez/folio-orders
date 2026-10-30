/** Browser-only navigation and keyboard affordances, independent of order rules. */
export function initWorkspace() {
  const search = document.querySelector('#search');
  const returnLink = document.querySelector('.portfolio-return');
  if (location.pathname.includes('/demos/folio/')) returnLink.href = '../../#proyecto-folio';
  document.addEventListener('keydown', (event) => {
    const editing = event.target.closest('input, select, textarea, [contenteditable="true"]');
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      document.querySelector('dialog[open]')
    )
      return;
    if (event.key === '/' && !editing) {
      event.preventDefault();
      search.focus();
    }
  });
  document.querySelector('#empty-reset').addEventListener('click', () => {
    document.querySelector('#clear-filters').click();
    search.focus();
  });
}
