# Folio / Pedidos & entregas

Una aplicación para responder tres preguntas de una operación comercial: qué se pidió, cuánto se entregó y qué compromiso quedó vencido.

Proyecto de demostración de Ariel López. No está conectado a SAP, no representa a un cliente y utiliza empresas, materiales y operaciones ficticias. La fecha de corte es **22/10/2026** para que el escenario sea reproducible.

[Abrir demo](https://enriqueariellopez.github.io/folio-orders/)

La transferencia del repositorio a `EnriqueArielLopez` fue solicitada; la URL de Pages indicada corresponde al destino y requiere completar esa transferencia y verificar la publicación.

La interfaz utiliza un escritorio operativo: navegación lateral, resumen continuo, gráficos y detalle de pedidos. `identity.css` contiene la composición visual, separada de las reglas base y de la lógica de negocio.

## Qué se puede hacer

- Filtrar por cliente/pedido, región, estado, fechas y compromisos vencidos.
- Revisar las líneas de un pedido y registrar entregas acumuladas, incluidas entregas parciales.
- Cancelar o reactivar un pedido. Los cancelados quedan fuera de los indicadores.
- Importar un CSV con varias líneas por pedido. La importación es atómica: un error conserva los datos anteriores.
- Exportar la selección actual y recuperar los cambios al volver al mismo navegador.
- Analizar el mismo CSV mediante un modelo SQLite, sin instalar un motor de base de datos.

## Ejecutar

Node 20+ para las pruebas; Python 3.10+ para servir y para la consulta SQL. La interfaz no tiene dependencias de ejecución, instalación ni compilación.

```sh
python -m http.server 4181 --bind 127.0.0.1
# Abrir http://127.0.0.1:4181
npm test
python scripts/analyze_sql.py examples/pedidos.csv
```

`npm test` usa exclusivamente el runner incluido en Node. No hace falta ejecutar `npm install`.

## Datos y decisiones

El CSV tiene estas columnas: `pedido,cliente,region,fecha,compromiso,material,descripcion,cantidad,precio_unitario,entregado`. `cancelado` es opcional (`0` o `1`). Se incluye una plantilla en `examples/pedidos.csv`.

- Precio: moneda única **ARS**, sin IVA, con punto decimal y sin separadores de miles. Fechas ISO `YYYY-MM-DD`.
- Máximo 2 MB, 5.000 líneas y un año de pedidos por importación. Fechas entre 2000 y 2100.
- Importes en **centavos enteros**, tanto en JavaScript como en SQL. El porcentaje de entrega se pondera por valor, no por cantidad de materiales distintos.
- El compromiso vence cuando su fecha es anterior al corte y queda valor pendiente de entrega.
- El gráfico agrupa por semana; para más de 90 días cambia a meses. Se incluyen períodos sin pedidos.
- La exportación neutraliza celdas que podrían ejecutarse como fórmulas al abrir un CSV en una planilla.

## Estructura

| Archivo | Responsabilidad |
| --- | --- |
| `src/domain.js` | Reglas de negocio, importación y cálculos independientes de la interfaz |
| `src/csv.js` | CSV con BOM, comillas, separadores y campos multilínea |
| `src/app.js` | Eventos, vista filtrada, gráfico, ficha y persistencia local |
| `sql/schema.sql` | Cabecera/posiciones, restricciones y vista de resumen |
| `scripts/analyze_sql.py` | Carga transaccional en SQLite en memoria y consulta del resumen |
| `tests/` | Casos de dinero, entregas, cancelación, fechas e importación |

La interfaz opera en memoria y `localStorage`. El modelo SQL es una implementación verificable separada; no se presenta como un backend que la demo no tiene.

## Validación y límites

Las pruebas verifican precisión monetaria, sobreentregas, estados, vencimientos, cancelaciones, ida y vuelta CSV y entradas malformadas. La revisión funcional cubre filtros, entrega parcial, cancelación/reactivación, paginación y móvil.

La demo no incluye usuarios, permisos, concurrencia ni sincronización entre equipos. La restauración del ejemplo reemplaza la copia local. Para guardar archivos importados fuera del navegador, exportarlos antes de restaurar. No se hacen solicitudes de red con los datos cargados.

Tipografía Manrope, bajo SIL Open Font License (`assets/OFL.txt`). Código de aplicación propio de este proyecto.

Validación del 22/10/2026: 17 pruebas aprobadas en Local y GitHub Actions. Demo publicada en GitHub Pages desde main; smoke externo de HTML, scripts y CSV. Se verificaron importación/exportación real, entregas, cancelación/reactivación y adaptación móvil. No se modificaron servicios corporativos.
