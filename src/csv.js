// Parser CSV sin dependencias. Admite BOM, comas/punto y coma y campos multilínea.
export function parseCSV(source, maxRows = 5000) {
  if (typeof source !== 'string' || source.length > 2_000_000) throw new Error('El archivo supera el límite de 2 MB.');
  const text = source.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/)[0];
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', quoted = false, endedQuote = false;
  const finishCell = () => { row.push(cell); cell = ''; endedQuote = false; };
  const finishRow = () => { finishCell(); if (row.some(value => value !== '')) rows.push(row); row = []; if (rows.length > maxRows + 1) throw new Error(`Máximo ${maxRows} filas.`); };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') { quoted = false; endedQuote = true; }
      else cell += char;
    } else if (char === '"') {
      if (cell || endedQuote) throw new Error('Comillas inesperadas en el CSV.');
      quoted = true;
    } else if (char === delimiter) finishCell();
    else if (char === '\n' || char === '\r') { if (char === '\r' && text[i + 1] === '\n') i++; finishRow(); }
    else { if (endedQuote) throw new Error('Hay texto después de una comilla de cierre.'); cell += char; }
    if (cell.length > 2000) throw new Error('Una celda supera los 2.000 caracteres.');
  }
  if (quoted) throw new Error('Hay un campo entre comillas sin cerrar.');
  if (row.length || cell || endedQuote) finishRow();
  if (rows.length < 2) throw new Error('Se necesita una cabecera y al menos una fila.');
  const headers = rows.shift().map(value => value.trim());
  if (headers.some(value => !value) || new Set(headers).size !== headers.length) throw new Error('Hay cabeceras vacías o repetidas.');
  return { headers, rows: rows.map((values, index) => { if (values.length !== headers.length) throw new Error(`Fila ${index + 2}: se esperaban ${headers.length} columnas.`); return Object.fromEntries(headers.map((header, i) => [header, values[i]])); }) };
}
export function toCSV(headers, rows) {
  const escape = value => { let text = String(value ?? ''); if (/^[\s\uFEFF]*[=+@\-＝＋－＠\t\r\n]/u.test(text)) text = "'" + text; return '"' + text.replaceAll('"', '""') + '"'; };
  return '\uFEFF' + [headers, ...rows.map(row => headers.map(header => row[header]))].map(row => row.map(escape).join(',')).join('\r\n');
}
