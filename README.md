# Folio · Pedidos y entregas

Folio te ayuda a seguir **qué pidió cada cliente, cuánto le entregaste y qué falta**. Sirve para ventas, administración y quienes preparan entregas. Cargás una planilla de pedidos, anotás las entregas y descargás el listado que necesitás.

Por ejemplo: Taller Roca pide 24 soportes. Ya recibió 12. Si hoy entregás otras 6, registrás **18 entregadas en total** y Folio muestra **6 pendientes**. No necesitás registrarte ni instalar nada para probarlo.

**[Abrir Folio →](https://enriqueariellopez.github.io/folio-orders/)**

La demo ya tiene 28 pedidos ficticios. Podés modificarlos para conocer la herramienta; no afectan a ninguna empresa ni a otra persona. Proyecto de Ariel López.

## Mirá primero cómo funciona

En la parte superior de la app, tocá **Ver cómo funciona**. Abre una guía visual con seis escenas de un pedido ficticio:

1. Qué pidió el cliente y cuánto falta entregar.
2. Dónde abrir la ficha del pedido.
3. Cómo registrar una entrega acumulada: de 12 a 18.
4. Cómo quedan las 6 unidades pendientes y su valor.
5. Cómo encontrar pedidos con la fecha prometida vencida.
6. Cómo entrar con una planilla CSV y descargar la vista filtrada.

La guía empieza **en pausa**, para que la leas a tu ritmo. Usá **Anterior** y **Siguiente**, o **Reproducir guía** para avanzar automáticamente cada 12 segundos. Podés pausar, reiniciar o cerrar cuando quieras. **Cerrar**, **Terminar guía** y la tecla **Escape** vuelven a la aplicación.

Es una simulación interactiva de la interfaz, con datos propios: no cambia los pedidos, filtros o archivos que cargaste ni guarda datos en tu sesión. Si tu sistema pide movimiento reducido, la guía muestra las escenas sin animaciones. [Abrir directamente la guía →](https://enriqueariellopez.github.io/folio-orders/?tutorial=1)

## Cómo usar Folio

### 1. Encontrá un pedido

Usá **Pedido o cliente** para buscar un nombre o un número. Si preferís, elegí un estado, una región o un rango de fechas de alta. La tabla, los importes y los gráficos se actualizan con la selección.

- **Fuera de compromiso** muestra los pedidos con una entrega pendiente y una fecha de compromiso anterior al corte de análisis. Volvé a pulsarlo para quitar ese filtro.
- **Limpiar** borra todos los filtros.
- Las flechas al pie de la tabla cambian de página. En un celular, deslizá la tabla hacia los costados para ver todas las columnas.
- Pulsá **Pedido** para cambiar el orden por número o **Valor neto** para mostrar los mayores importes primero.

### 2. Registrá una entrega

Abrí la ficha con **↗** al final de la fila. En cada material aparece la cantidad solicitada y la cantidad ya entregada. Cambiá **Entregado de…** y pulsá **Guardar entrega**.

**La cantidad es acumulada:** si ya entregaste 3 unidades y hoy entregás 2 más, escribí **5**, no 2. Folio no permite superar la cantidad solicitada.

El estado se calcula solo:

| Estado | Qué significa |
| --- | --- |
| Pendiente | Todavía no se entregó ninguna unidad. |
| Parcial | Se entregó una parte del pedido. |
| Entregado | Se entregaron todas las unidades. |
| Cancelado | Se canceló el pedido y queda fuera de los indicadores. |

En la misma ficha podés **Cancelar pedido** o **Reactivar pedido**. La cancelación conserva las cantidades registradas; podés volver a activarlo cuando quieras. Cerrá la ficha con **×** o con la tecla **Escape**.

### 3. Guardá lo que necesitás

**Exportar vista** descarga un archivo `folio-pedidos.csv` con todos los pedidos que coinciden con los filtros, incluidas las páginas que no estás viendo. Los cambios también se guardan en este navegador y se recuperan al volver a abrir Folio.

Para empezar de nuevo, pulsá **Restaurar ejemplo**. Esto reemplaza los datos y las entregas de tu sesión por los 28 pedidos iniciales. Si querés conservar tu trabajo, exportalo antes.

## Importar tus propios pedidos

1. Descargá la [plantilla CSV](examples/pedidos.csv) o usá **Descargar plantilla CSV** al pie de la aplicación.
2. Abrila en una planilla y completá las columnas sin cambiar sus nombres. Cada fila representa un material; repetí el número de pedido si tiene varios materiales.
3. Guardá el archivo como CSV y pulsá **Importar CSV** en Folio.

Una importación correcta reemplaza los pedidos que había en el navegador. Si hay un error, aparece un aviso y los datos anteriores se conservan.

| Columna | Qué completar | Ejemplo |
| --- | --- | --- |
| `pedido` | Número o identificador del pedido | `PED-001` |
| `cliente` | Nombre del cliente | `Comercial del Sur` |
| `region` | Región o zona | `AMBA` |
| `fecha` | Fecha de alta, con formato año-mes-día | `2026-10-01` |
| `compromiso` | Fecha prometida de entrega, con el mismo formato | `2026-10-20` |
| `material` | Código del material | `MAT-001` |
| `descripcion` | Nombre del material | `Caja organizadora` |
| `cantidad` | Unidades solicitadas | `10` |
| `precio_unitario` | Precio en pesos, con punto decimal y sin miles | `1250.50` |
| `entregado` | Unidades acumuladas entregadas | `4` |
| `cancelado` | Opcional: `1` si está cancelado; `0` si está activo | `0` |

Los datos generales de un pedido deben coincidir en todas sus filas. Se admiten archivos de hasta **2 MB**, con **5.000 filas** y hasta un año entre la primera y la última fecha de alta. Las fechas deben estar entre 2000 y 2100.

## Cómo leer los números

- **Valor de pedidos activos:** importe total de los pedidos seleccionados, sin los cancelados.
- **Por entregar:** valor de las unidades que todavía faltan entregar.
- **Pedidos activos:** cantidad de pedidos seleccionados, sin los cancelados.
- **Avance de entrega:** porcentaje del valor entregado sobre el valor total. Se pondera por importe, no por cantidad de materiales.
- **Ritmo de pedidos:** valor por semana de alta. Para períodos de más de 90 días, se agrupa por mes. Si hay muchos períodos, desplazá el gráfico hacia los costados. Los importes excepcionalmente largos también se pueden desplazar dentro de su indicador para leer todos los dígitos.

Todos los importes están en **pesos argentinos (ARS), sin IVA**. Son valores de pedidos; no representan facturación ni cobros. El corte de análisis está fijado en **22/10/2026**, para que el ejemplo produzca siempre el mismo resultado.

## Privacidad y límites

Los archivos se procesan en tu navegador y no se envían a un servidor. La sesión se conserva en el almacenamiento local del navegador: no se comparte entre computadoras, perfiles o personas. Si borrás los datos del navegador, esa copia puede desaparecer; usá **Exportar vista** para conservar un archivo.

La demo no tiene usuarios, permisos, trabajo simultáneo entre personas ni conexión con SAP. Las empresas, los materiales y las operaciones del ejemplo son ficticios.

## Ejecutar en tu computadora

Necesitás **Python 3.10 o posterior**. Descargá este repositorio y abrí una terminal dentro de su carpeta. Ejecutá:

```sh
python -m http.server 4181 --bind 127.0.0.1
```

Después abrí **http://127.0.0.1:4181** en el navegador. Mantené la terminal abierta mientras lo usás; para detener el servidor, presioná `Ctrl+C`. Si en Windows el comando `python` no existe, probá `py -m http.server 4181 --bind 127.0.0.1`.

No hay que instalar paquetes ni compilar la aplicación. Abrir `index.html` con doble clic no es suficiente, porque la aplicación utiliza módulos de JavaScript.

## Para desarrollar

HTML, CSS y JavaScript con módulos nativos. La interfaz usa un escritorio de operaciones azul oscuro, superficies opacas, cifras tabulares y controles con foco de teclado visible. En pantallas angostas, la tabla conserva sus columnas y permite desplazamiento horizontal. Los paneles de datos y la barra lateral no requieren filtros de desenfoque.

Requisitos de validación: **Node 22 o 24 LTS+** y **Python 3.10+**. No hace falta `npm install`.

```sh
npm test
python scripts/analyze_sql.py examples/pedidos.csv
```

Si Python está instalado con otro nombre o ruta, definí `LOTE_PYTHON` con su ejecutable antes de correr las pruebas. Ese nombre se conserva por compatibilidad con el runner compartido de validación.

| Archivo | Responsabilidad |
| --- | --- |
| `src/domain.js` | Importación y reglas de pedidos, cantidades, estados e importes |
| `src/csv.js` | Lectura y escritura CSV con comillas, BOM y campos multilínea |
| `src/app.js` | Filtros, tabla, gráfico, ficha y sesión local |
| `src/tutorial.js` / `src/tutorial-model.js` | Guía visual y pedido ficticio independiente de la sesión |
| `style.css` / `identity.css` | Diseño adaptable y detalles visuales del escritorio |
| `sql/schema.sql` | Modelo relacional de cabecera y posiciones, restricciones y resumen |
| `scripts/analyze_sql.py` | Carga transaccional y consulta SQLite en memoria |
| `tests/` | Pruebas de negocio, CSV y paridad con SQLite |

Los importes se calculan en centavos enteros. El modelo SQLite se ejecuta por separado para comprobar los resultados; no es un backend de la aplicación web. El analizador Python rechaza cantidades fuera de 1–100.000, sobreentregas, precios fuera del formato de la web y totales por pedido o lote activo superiores a `2^53 - 1` centavos. Esto evita que SQLite convierta un importe desbordado a punto flotante. Los errores de CSV y validación terminan con código `2` y un mensaje, sin emitir un resumen parcial.

La exportación entrecomilla los campos, duplica las comillas internas y antepone un apóstrofo a valores con posibles iniciadores de fórmula: `=`, `+`, `-`, `@`, sus variantes de ancho completo y tabulaciones o saltos de línea iniciales. Las pruebas comprueban la serialización del archivo; no ejecutan Excel ni otras planillas. Algunas planillas pueden eliminar la protección al guardar y volver a abrir el CSV: no existe una defensa universal para todos los consumidores, como explica [OWASP sobre CSV Injection](https://community.owasp.org/attacks/CSV_Injection).

### Validación y publicación

26 pruebas cubren precisión monetaria, entregas parciales, sobreentregas, estados, cancelación, vencimientos, fechas, importación atómica, CSV y paridad JavaScript/SQLite, además de los prefijos peligrosos en CSV, desbordes del analizador SQL, entradas incompletas y el cálculo aislado del ejemplo de la guía. La integración continua las ejecuta con Node y Python. Los cambios de interfaz requieren además una revisión visual y funcional de filtros, ficha, teclado y móvil.

GitHub Pages publica `main` en la cuenta personal **EnriqueArielLopez**. Esta demo es independiente de los ambientes y servicios corporativos de Practical Solutions; su validación se realiza en Local y GitHub Pages.

### Seguridad del navegador y del CI

La revisión de seguridad del 23 de octubre de 2026 reforzó los prefijos de fórmulas CSV y los límites numéricos del analizador SQL. La página incluye una política CSP parcial que bloquea bases HTML, objetos, envíos de formulario a la red y manejadores JavaScript en atributos; no reemplaza una CSP completa del servidor. Las pruebas locales usan Node 22 LTS. La migración del CI a Node 24 LTS y a acciones fijadas por commit quedó preparada: GitHub requiere el permiso `workflow` que no incluye la credencial actual; el workflow vigente todavía usa Node 20 y etiquetas de versión.

### Tipografías y licencias

Folio combina **IBM Plex Sans** en controles, tablas y textos con **Barlow Condensed SemiBold** en el título, el logotipo y los valores principales. La jerarquía usa cifras tabulares y una composición industrial; las fuentes se sirven desde el repositorio, sin solicitudes a Google Fonts durante el uso.

- [IBM Plex Sans](https://github.com/google/fonts/tree/main/ofl/ibmplexsans): archivo variable original `assets/ibm-plex-sans.ttf`, ejes de peso 100–700 y ancho 75–100 %. Licencia SIL OFL en [OFL-IBM-Plex-Sans.txt](assets/OFL-IBM-Plex-Sans.txt).
- [Barlow Condensed](https://github.com/google/fonts/tree/main/ofl/barlowcondensed): peso SemiBold 600 en `assets/barlow-condensed-semibold.ttf`. Licencia SIL OFL en [OFL-Barlow-Condensed.txt](assets/OFL-Barlow-Condensed.txt).

Los archivos TTF proceden del repositorio oficial Google Fonts y se conservan sin modificaciones.


## Revisión de interfaz · 30 de octubre de 2026

La interfaz prioriza datos y tareas: superficies más simples, jerarquía tipográfica y un enlace de retorno al portfolio que funciona también en la demo integrada. La tecla `/` lleva a la búsqueda cuando no se está editando otro campo ni hay un diálogo abierto. Los resultados de filtros y paginación se anuncian mediante una región de estado accesible.

`src/workspace.js` contiene estas mejoras de navegación, separado de las reglas de negocio. El código del frontend usa un formato consistente definido en `.prettierrc.json` y `.editorconfig`; no se añadieron dependencias de runtime. Las guías mantienen sus ejemplos separados de la sesión de trabajo.
