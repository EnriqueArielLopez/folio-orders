const sprite = new URL('../assets/icons.svg', import.meta.url).href;

// Names are local constants. User-provided content never enters this markup.
export function icon(name) {
  return `<svg class="icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${sprite}#${name}"></use></svg>`;
}
