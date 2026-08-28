# Monitor Estadístico Argentina — Requerimientos funcionales

**Versión:** 2.8 · **Fecha:** 2026-08-28 · **Estado:** construido — F0 a F5 completas, 69 indicadores

> **Cambios respecto de la v2.7:** se **da de baja la fuente S2 (ArgentinaDatos)** y con ella los 8 indicadores que dependían de un agregador: riesgo país, inflación serie larga, las cinco cotizaciones del dólar y la brecha cambiaria. Es una revisión del criterio de §4.5: un tercero que redistribuye dato de otro no permite verificar contra el emisor qué se publicó ni cuándo cambió, y ninguna serie del sitio debería descansar en eso. RF-9.4 queda sin fuentes a las que aplicar, y la brecha cambiaria de §8 deja de ser construible (L18).
>
> **Cambios de la v2.6 a la v2.7:** las variaciones por período se pueden ver como **acumulado en base 100 al inicio del período visible** (RF-3.95 a RF-3.99).
>
> **Cambios de la v2.5 a la v2.6:** la verificación del catálogo contra el dump oficial de metadatos deja de ser manual y pasa a ser **un script que corre en el job diario** (RF-0.14 a RF-0.17). Se documenta que las fechas de cobertura del dump pueden ir por detrás de la API (L17).
>
> **Cambios de la v2.4 a la v2.5:** un panel puede quedar **sin ningún indicador seleccionado** (RF-3.66 renumerado a RF-3.91). Se reemplaza el botón «dejar uno» por **«eliminar indicadores»**, que los quita todos.
>
> **Cambios de la v2.3 a la v2.4:** las marcas de las tablas —«a caballo», «recortado», «quiebre», «en curso», «faltan N»— pasan de ser texto con `title` a **botones que llevan a un glosario** en el panel de metodología (RF-9.11 a RF-9.15).
>
> **Cambios de la v2.2 a la v2.3:** las gestiones presidenciales se **acumulan** en lugar de reemplazarse (RF-4.7 a RF-4.9). Se pueden abrir **varios gráficos** con una sola ventana de tiempo (RF-3.80 a RF-3.84). Las series en pesos se pueden **corregir por inflación o expresar en dólares** (§5.8, RF-3.85 a RF-3.90).
>
> **Cambios de la v2.1 a la v2.2:** el color de las series se asigna desde una **paleta validada** en lugar de elegirse a mano por indicador (RF-3.66 a RF-3.70), y se agregan **etiquetas al final de cada línea** porque con más de cuatro series el color no alcanza. La nota de comparabilidad internacional se reescribe como advertencia general (RF-3.41b).
>
> **Cambios de la v2.0 a la v2.1:** el catálogo pasa de 18 a **77 indicadores**. Se agregan indicadores **calculados** a partir de otros (§5.6): brecha cambiaria y salario real. El selector pasa a una **columna a la izquierda**, agrupable por tipo de indicador o por fuente (RF-3.50 a RF-3.53 renumerados a §8.4). Hallazgo relevante en el Anexo D sobre el salario real y el deflactor.
>
> **Cambios de la v1.11 a la v2.0:** se completan las fases F0 a F5. Los datos pasan a leerse de **copias locales publicadas con el sitio** en lugar de consultar las APIs desde el navegador (RF-0.6 extendido a todas las fuentes), con **refresco diario automático** (RF-0.12). Se agregan la frecuencia `irregular` (RF-1.13) y hallazgos de construcción en el Anexo D.
>
> **Cambios de la v1.10 a la v1.11:** se corrige RF-1.4, que mandaba colapsar las series diarias a mensual. El colapso reetiquetaba el valor de fin de mes con la fecha de inicio de mes y atribuía a la gestión equivocada la devaluación de diciembre de 2023. **Se respeta la frecuencia de publicación de cada serie** (RF-1.4, RF-3.33) y se agrega paginación (RF-1.11). Detalle en L16.
>
> **Cambios de la v1.9 a la v1.10:** se registra la validación de la inflación acumulada por gestión (§7.5), criterio de salida de F2, y el hallazgo que arrojó: el hueco de 2016 cae dentro de una gestión y la deja incompleta. Se agrega RF-6.10 sobre observaciones faltantes.
>
> **Cambios de la v1.8 a la v1.9:** se precisa L1 con lo verificado al construir F1: el hueco de la **variación mensual** va de 2015-11 a 2016-04, un mes más que el del índice, y la inflación se compone de cuatro series (§5.1).
>
> **Cambios de la v1.7 a la v1.8:** el techo de peso del bundle pasa de 250 kB a **1 MB gzip** (RNF-2), por decisión explícita. Se actualiza la medición con el dato real posterior a F0.
>
> **Cambios de la v1.6 a la v1.7:** se decide la **opción A** para el backoffice (§8.10.1): carga por repositorio, sin backend. RNF-1 queda firme.
>
> **Cambios de la v1.5 a la v1.6:** la carga de series por CSV deja de ser una función del usuario final y pasa a ser una **función administrativa de backoffice** (§8.10). Queda abierta la decisión de mecanismo, con recomendación en §8.10.1.
>
> **Cambios de la v1.4 a la v1.5:** queda establecido que **el IPC publicado por el INDEC se muestra siempre completo, incluido 2007-2015** (RF-3.50 a RF-3.53). Los IPC provinciales son series adicionales seleccionables, nunca sustitutos, y la comparación la hace el usuario en el panel. Se quita el lenguaje valorativo de L2 y de RF-3.23.
>
> **Cambios de la v1.2 a la v1.4:** se aprueba CEDLAS/SEDLAC como fuente S7 (§4.5), con el nuevo nivel de fuente **académica** (§4.3) y la regla de no empalme con series oficiales (RF-0.10). Se documenta lo que aporta en §5.5 y sus limitaciones propias, L12 a L14. Se explicita el **panel único de comparación** (§8.4) y se corrige RF-4.4. Se incorpora **comparación internacional** (§8.5), con advertencia metodológica obligatoria y L15.
>
> **Cambios de la v1.1 a la v1.2:** se aprueban las seis fuentes propuestas, S1 a S6 (§4.5). Se incorporan los indicadores que habilitan (§5.4). El hueco de IPC 2015-2016 queda resuelto por S1 (§6, L1). Se agrega validación obligatoria de snapshots por el riesgo de soft-404 (RF-0.8, L10) y se reordena F3 en dos tramos según el estado de implementación de cada fuente.
>
> **Cambios de la v1.0 a la v1.1:** se admiten fuentes de datos además de `apis.datos.gob.ar`, sujetas a aprobación manual una por una (§4). Se refuerza el requerimiento de notas metodológicas sobre el gráfico (§8.3). Se agrega la sección de fuentes con enlaces (§4.6 y RF-9.5 a RF-9.10). Se fija la paleta de gestiones por fuerza política (RF-6.9 a RF-6.12). Se documenta una vía para el tramo de IPC cuestionado que no requiere fuente nueva (§6, L2).

---

## 1. Propósito

Una aplicación web pública que permite comparar la evolución de indicadores económicos y sociales **a lo largo del tiempo, entre gestiones presidenciales argentinas y entre países**, usando exclusivamente datos de fuentes aprobadas, consistentes y trazables.

Dos ejes de comparación:

- **Temporal e interno.** Cómo evolucionó un indicador en Argentina y cómo se ve esa evolución partida por gestión presidencial.
- **Internacional.** Cómo evolucionó el mismo indicador en otros países, para dimensionar si un movimiento es local o regional.

El objetivo es que cualquier persona pueda responder preguntas como *"¿cómo evolucionó la pobreza durante cada gobierno?"* sin tener que descargar planillas del INDEC ni confiar en la interpretación de un tercero. La aplicación presenta el dato, su fuente y su metodología; no emite juicios de valor.

## 2. Decisiones de producto

Estas decisiones son la base del documento y no se re-discuten durante la construcción.

| # | Decisión | Implicancia |
|---|---|---|
| D1 | **Solo datos reales de fuentes aprobadas.** Se eliminan por completo los datos de ejemplo aproximados que existen hoy en el código. | Si una serie no está disponible, el indicador muestra un estado de error explícito. Nunca se presenta un número estimado como oficial. |
| D1b | **Múltiples fuentes, con aprobación manual una por una.** No se limita a `apis.datos.gob.ar`, pero **ninguna fuente entra sin autorización explícita** del responsable del proyecto. | Requiere un registro de fuentes versionado, con estado por fuente y un control mecánico que impida consultar una fuente no aprobada (§4). |
| D2 | **Set amplio económico-social.** | Requiere un modelo de datos genérico, no casos particulares hardcodeados. |
| D3 | **Sitio público para compartir.** | URLs compartibles con estado, exportación, textos explicativos, responsive, deploy estático. |
| D5 | **Comparación internacional en alcance.** El usuario puede graficar el mismo indicador para varios países. | Exige series comparables y una advertencia metodológica obligatoria: la forma de medir varía sustancialmente de un país a otro (§8.5, L15). |
| D4 | **Métricas correctas y neutrales.** Sin rankings ni destacados. | Inflación acumulada/anualizada en lugar de promedio aritmético; nota metodológica visible; el usuario saca sus conclusiones. |

## 3. Principios de integridad del dato

Son requerimientos, no aspiraciones. Cualquier funcionalidad que los contradiga se descarta.

- **P1 — Trazabilidad.** Todo número visible en la aplicación debe poder rastrearse a una fuente aprobada y a un identificador de serie concreto. La UI expone fuente e identificador.
- **P2 — Los huecos se muestran, no se rellenan.** Si no hay dato para un período, el gráfico muestra un hueco. Está prohibido interpolar, extrapolar, imputar o empalmar series distintas sin marcarlo.
- **P3 — Los quiebres metodológicos se declaran sobre el gráfico.** Cuando cambia la base, la cobertura, la metodología o el organismo de una serie, la aplicación lo señala **en el gráfico mismo**, en la fecha exacta del cambio, y lo explica en texto. Detalle en §8.3.
- **P4 — Los fallos son visibles.** Un error de red o una serie caída se muestra en la interfaz. Está prohibido degradar silenciosamente a otra fuente.
- **P5 — Sin métricas engañosas.** No se calcula ninguna agregación inválida para el tipo de indicador (ver §7).
- **P6 — La jerarquía de fuentes es explícita.** Ante dos fuentes para el mismo dato gana la primaria. Una fuente secundaria o un agregador solo cubren lo que la primaria no publica, y siempre rotulados como tales.

## 4. Política de fuentes de datos

### 4.1 Estados de una fuente

Toda fuente vive en un registro versionado en el repositorio, con uno de tres estados:

| Estado | Significado | ¿Se puede usar? |
|---|---|---|
| **`aprobada`** | Autorizada explícitamente por el responsable del proyecto, con fecha de aprobación registrada. | Sí |
| **`propuesta`** | Relevada y verificada técnicamente, esperando autorización. | **No** |
| **`rechazada`** | Evaluada y descartada, con el motivo asentado. | No |

### 4.2 Requerimientos de la política

- **RF-0.1** El registro de fuentes es un archivo versionado con: identificador, nombre del organismo, host, nivel (§4.3), estado, fecha de aprobación, condiciones de uso y notas de verificación técnica.
- **RF-0.2** El cliente de datos **solo puede consultar hosts en estado `aprobada`**. El control es mecánico: un indicador que referencie una fuente no aprobada hace fallar el build y los tests, no falla en runtime. La aprobación no depende de la buena voluntad de quien programa.
- **RF-0.3** Agregar una fuente al registro en estado `aprobada` requiere un cambio explícito y separado, revisable en el historial de git.
- **RF-0.4** Cada serie del catálogo declara su fuente. La interfaz muestra el organismo y el nivel de la fuente junto al dato.
- **RF-0.5** Ante dos fuentes disponibles para el mismo dato, se usa la de mayor nivel jerárquico (P6). La elección queda asentada en el registro con su justificación.
- **RF-0.6** Una fuente sin CORS no puede consultarse desde el navegador. Se accede mediante **snapshot en tiempo de build**: un script del repositorio descarga el archivo, lo normaliza a JSON y lo commitea junto a la fecha de descarga y la URL de origen. El snapshot es dato real y trazable, pero **debe mostrar su fecha de captura en la UI**, porque no se actualiza solo.
- **RF-0.7** Nunca se mezclan dos fuentes en una misma serie sin marca de empalme visible (P3).
- **RF-0.8** El script de snapshot **valida que lo descargado sea efectivamente dato** antes de commitearlo: verifica tipo de contenido, estructura y forma esperada de filas, y **falla ruidosamente** si no coincide. No alcanza con verificar el código HTTP.
- **RF-0.9** Cada snapshot lleva, junto al dato, un archivo de procedencia con: URL exacta, fecha y hora de descarga, hash del archivo original y cantidad de filas obtenidas. Un snapshot sin procedencia no se acepta.
- **RF-0.10** Una serie de fuente **académica** nunca se empalma con una serie oficial ni la sustituye. Se presenta como indicador propio, con su metodología rotulada en la UI, y las tablas comparativas oficiales no la incluyen. Puede graficarse junto a una serie oficial, siempre visualmente diferenciada.
- **RF-0.11** Cuando una fuente publica en tandas versionadas, el registro guarda la **versión o tanda** de cada archivo, porque distintos archivos de la misma fuente pueden tener distinta actualidad.
- **RF-0.12** **La aplicación no consulta las APIs: lee copias locales publicadas junto al sitio.** Las copias se toman con un script del repositorio y se refrescan **automáticamente una vez por día** mediante un job programado que commitea el resultado y dispara el deploy. El visitante recibe el dato del día sin que nadie actualice nada a mano, la carga es inmediata y el sitio no depende de que las fuentes estén disponibles ni sean rápidas.
- **RF-0.13** Toda copia local declara cuándo se tomó, y la interfaz lo muestra junto a cada indicador. Un dato con fecha de copia visible es honesto; uno sin ella, no.
- **RF-0.14** El catálogo se **verifica automáticamente contra el dump oficial de metadatos** de la API, que es donde la propia documentación indica que están los identificadores de serie. Corre en el job diario, después de tomar la copia.
- **RF-0.15** Que una serie **desaparezca del catálogo oficial o figure como discontinuada** es un error que corta el job. Es la única forma de enterarse: la API sigue devolviendo el dato viejo sin error, simplemente deja de actualizarlo.
- **RF-0.16** La **actualidad** se mide contra la copia local, no contra el dump (L17), y contra un umbral que contempla el rezago habitual de publicación, no solo la frecuencia. Una serie atrasada es un aviso, no un error.
- **RF-0.17** La verificación revisa además que una serie declarada en porcentaje no tenga todos sus valores por debajo de 1,5, que es la marca de una fracción sin escalar. Es el error que ya se coló una vez.

### 4.3 Niveles de fuente

- **Primaria** — el organismo que produce y publica el dato (INDEC, BCRA, direcciones provinciales de estadística).
- **Secundaria oficial** — un organismo público que republica dato de otro (el BCRA republicando el IPC del INDEC).
- **Agregador** — un tercero que redistribuye dato producido por otro. Admisible solo cuando no hay acceso programático a la primaria, y siempre rotulado.
- **Académica / de investigación** — una institución que **produce estimaciones propias** procesando microdatos primarios con metodología publicada. No redistribuye el dato oficial: genera uno distinto. Sus series son indicadores por derecho propio, nunca versiones alternativas de un indicador oficial, y por lo tanto **no se empalman con series oficiales** (RF-0.10).

### 4.4 Criterios de admisibilidad

Para que una fuente sea proponible debe cumplir los seis:

1. **Organismo identificable** y responsable del dato.
2. **Metodología publicada.**
3. **Serie histórica consistente**, no recalculada retroactivamente sin aviso.
4. **Periodicidad de actualización declarada.**
5. **Acceso programático estable** — API o archivo con URL estable — y condiciones de uso que permitan la redistribución.
6. **Trazabilidad**: cada punto atribuible a una publicación concreta.

### 4.5 Registro de fuentes

#### Aprobadas

Las seis fuentes propuestas en la v1.1 fueron **aprobadas el 2026-08-27**. La columna «Implementación» es la que ordena el trabajo: tener la fuente aprobada no significa tener la URL resuelta.

| # | Fuente | Host | Nivel | CORS | Aprobada | Implementación |
|---|---|---|---|---|---|---|
| — | **Series de Tiempo AR** (Ministerio de Economía) | `apis.datos.gob.ar` | Primaria / Secundaria oficial | Sí | v1.0 | **Lista** — endpoints verificados |
| S1 | **BCRA API v4.0** | `api.bcra.gob.ar` | Primaria (monetario) / Secundaria oficial (IPC) | Sí | 2026-08-27 | **Lista** — endpoints y datos verificados |
| S2 | **ArgentinaDatos** | `api.argentinadatos.com` | Agregador | Sí | 2026-08-27 | **Dada de baja (v2.8)** — agregador, no verificable contra el emisor |
| S3 | **World Bank Open Data** | `api.worldbank.org` | Secundaria (multilateral) | Sí | 2026-08-27 | **Lista** — endpoint verificado |
| S4 | **INDEC** | `indec.gob.ar` | Primaria | No | 2026-08-27 | **URL a resolver** — ver §4.6 |
| S5 | **Secretaría de Finanzas** | `argentina.gob.ar` | Primaria | No | 2026-08-27 | **URL a resolver, fuente frágil** — ver §4.6 |
| S6 | **Estadística CABA** | `estadisticaciudad.gob.ar` | Primaria provincial | No | 2026-08-27 | **URL a resolver, posiblemente redundante** — ver §4.6 |
| S7 | **CEDLAS / SEDLAC** (UNLP + Banco Mundial) | `cedlas.econo.unlp.edu.ar` | Académica | No | 2026-08-27 | **Lista** — 16 planillas con URL estable verificada; requiere snapshot |

#### Detalle de las fuentes aprobadas

| # | Fuente | Qué aporta | Riesgo / condición |
|---|---|---|---|---|---|
| S1 | **BCRA API v4.0** — `api.bcra.gob.ar` | Serie de **inflación mensual continua 2003-01 → 2026-07, sin huecos** (`idVariable=27`), interanual (`28`), reservas diarias desde 2014-04 (`1`), tipo de cambio mayorista diario desde 2014-04 (`5`), base monetaria (`15`). 1.610 variables. | Es el banco central: máxima confiabilidad institucional. El tramo 2007-2015 de su serie de IPC **arrastra el dato intervenido del INDEC** (ver §6, L2): resuelve el hueco, no la credibilidad. |
| S2 | **ArgentinaDatos** — `api.argentinadatos.com` | **Riesgo país diario 1999-01-22 → hoy**, 7.686 puntos. Único acceso programático con CORS que encontré. | Es un proyecto comunitario, no el emisor. El dato original es el EMBI+ de J.P. Morgan, que **no publica un feed público gratuito**: elegir esta fuente es elegir un redistribuidor, no J.P. Morgan. Sin SLA ni garantía de continuidad. |
| S3 | **World Bank API** — `api.worldbank.org/v2` | Series anuales largas y homogéneas de pobreza, Gini y PIB; habilita comparación internacional. | Recopila del INDEC con rezago y homogeneización propia: puede diferir del dato nacional. Anual, no sirve para frecuencia fina. |
| S4 | **INDEC** — `indec.gob.ar` | **Indigencia como tasa** y cuadros completos de la EPH, que no están en la API de series. | Sin CORS: obliga al patrón snapshot (RF-0.6). Formatos XLS/PDF que cambian de estructura entre informes; el parseo es frágil y hay que fijar la URL exacta de cada cuadro. |
| S5 | **Secretaría de Finanzas** — `argentina.gob.ar/economia/finanzas` | **Deuda pública** (stock, composición por moneda y acreedor). | Sin CORS y publicación en XLSX con estructura variable. Requiere snapshot y revisión manual por release. |
| S6 | **Estadística Ciudad de Buenos Aires** — `estadisticaciudad.gob.ar` | IPCBA desde 2012-07 con continuidad, útil para el tramo cuestionado. | Sin CORS. **Probablemente redundante:** el IPC de San Luis ya cubre ese tramo desde dentro de la fuente aprobada (§6, L2). Antes de invertir en el snapshot, comparar ambas series. |
| S7 | **CEDLAS / SEDLAC** — `cedlas.econo.unlp.edu.ar` | Series distributivas armonizadas de América Latina, elaboradas por el CEDLAS (UNLP) junto al Banco Mundial. Para Argentina: **Gini desde 1974** y pobreza por líneas internacionales desde 1986, con frecuencia semestral desde 2003. Ver §5.5. | Sin CORS, pero **con URLs estables y verificadas**: es la única de las cuatro sin CORS que es implementable hoy. No es estadística oficial argentina: mide con **líneas internacionales en USD PPP**, no con la línea del INDEC, y su cobertura geográfica cambia a lo largo de la serie. Aplica RF-0.10. |

#### Rechazadas

| Fuente | Motivo |
|---|---|
| **Ámbito Financiero** — `mercados.ambito.com` | Devuelve HTTP 403 con política de seguridad que bloquea consultas programáticas. No cumple el criterio 5. |
| **Estimaciones privadas de inflación** (IPC Congreso, consultoras) | No cumplen el criterio 2: metodología no publicada de forma verificable y sin serie oficial continua. Se mantienen fuera de la v1. |

### 4.6 Estado de implementación de las fuentes sin CORS

Las tres fuentes sin CORS están aprobadas, pero el relevamiento del 2026-08-27 no logró resolver una URL de descarga estable para ninguna. Es trabajo abierto de F3, y hay que hacerlo con un navegador a la vista, no adivinando rutas.

**S4 · INDEC.** El sitio devuelve una página shell de ~37 KB para toda ruta profunda que probé, y responde **HTTP 200 con HTML** ante rutas de archivo inexistentes — un *soft-404*. Probé cinco rutas plausibles de cuadros de pobreza e indigencia y las cinco devolvieron la misma página. Consecuencia: adivinar URLs es inseguro y un script ingenuo guardaría el HTML creyendo que descargó datos. De ahí RF-0.8.

**S5 · Secretaría de Finanzas.** Las páginas de deuda existen y están desagregadas (evolución de la deuda bruta, composición por moneda, por acreedor, por residencia, en porcentaje del PBI). Pero **no publican un archivo descargable**: el gráfico se alimenta de una planilla embebida vía iframe. Es la más frágil de las seis. Además el título de la sección dice *«Visualización gráfica de la deuda (2004-2023)»*, lo que sugiere que ese conjunto no está actualizado; hay que verificar si existe otra vía antes de construir sobre esto.

**S6 · Estadística CABA.** La URL de sección que probé redirige (301). Antes de invertir en el snapshot conviene comparar el IPCBA contra el IPC de San Luis (§5.2), que ya está disponible en la fuente aprobada y cubre el mismo tramo: si San Luis alcanza, S6 no hace falta.

**S7 · CEDLAS.** Es la excepción y por eso va primero: aunque tampoco tiene CORS, sus 16 planillas cuelgan de rutas estables bajo `/wp/wp-content/uploads/`, devuelven el tipo de contenido correcto de xlsx y fueron descargadas y parseadas con éxito en el relevamiento. No hay URL que adivinar. Sirve además como caso de prueba del script de snapshot antes de pelear con S4 y S5.

**Regla de trabajo:** ninguna de las tres primeras entra al catálogo con una URL adivinada. Se captura manualmente desde el navegador, se registra en el registro de fuentes con su fecha de verificación, y el script la valida según RF-0.8.

### 4.7 Enlaces de las fuentes

Todas verificadas el 2026-08-27. Esta lista es la que alimenta la sección de fuentes de la aplicación (RF-9.5).

| Fuente | Estado | Enlace | Endpoint / API |
|---|---|---|---|
| **Series de Tiempo AR** — Ministerio de Economía | aprobada | [datosgobar.github.io/series-tiempo-ar-api](https://datosgobar.github.io/series-tiempo-ar-api/) · [datos.gob.ar](https://datos.gob.ar/) | `apis.datos.gob.ar/series/api/series` |
| **S1 · BCRA** | aprobada | [Catálogo de APIs del BCRA](https://www.bcra.gob.ar/BCRAyVos/catalogo-de-APIs-banco-central.asp) | `api.bcra.gob.ar/estadisticas/v4.0/monetarias` |
| **S2 · ArgentinaDatos** | ~~aprobada~~ **dada de baja (v2.8)** | [argentinadatos.com](https://argentinadatos.com/) | — |
| **S3 · World Bank Open Data** | aprobada | [Documentación de la API](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589) | `api.worldbank.org/v2/country/ARG/indicator/{codigo}` |
| **S4 · INDEC** | aprobada | [indec.gob.ar](https://www.indec.gob.ar/) | sin CORS — snapshot |
| **S5 · Secretaría de Finanzas** | aprobada | [argentina.gob.ar/economia/finanzas](https://www.argentina.gob.ar/economia/finanzas) | sin CORS — snapshot |
| **S6 · Estadística CABA** | aprobada | [estadisticaciudad.gob.ar](https://www.estadisticaciudad.gob.ar/) | sin CORS — snapshot |
| **S7 · CEDLAS / SEDLAC** — UNLP + Banco Mundial | aprobada | [Estadísticas SEDLAC](https://www.cedlas.econo.unlp.edu.ar/wp/en/estadisticas/sedlac/estadisticas/) · [CEDLAS](https://www.cedlas.econo.unlp.edu.ar/) | planillas xlsx bajo `/wp/wp-content/uploads/` — sin CORS, snapshot |
| **Direcciones provinciales de estadística** | aprobada (vía datos.gob.ar) | organismo productor en el metadato `dataset_fuente` de cada serie | a través de Series de Tiempo AR |
| **Ámbito Financiero** | rechazada | — | HTTP 403 |

*Nota: `apis.datos.gob.ar/series/api/` devuelve 404 como página; la documentación vive en `datosgobar.github.io`.*

### 4.8 Notas sobre riesgo país y J.P. Morgan

El índice de riesgo país argentino es el **EMBI+ de J.P. Morgan**, un producto propietario. J.P. Morgan es una fuente confiable del dato, pero **no ofrece un feed público gratuito**: no existe una vía de acceder al número directamente desde el emisor sin una suscripción comercial.

En la práctica, incorporar riesgo país significa elegir un **redistribuidor**. Las opciones relevadas:

- **ArgentinaDatos** (S2): funciona, tiene CORS, cobertura 1999→hoy. Es comunitario.
- **Ámbito Financiero**: bloquea el acceso programático (403).
- **Suscripción a J.P. Morgan o a un proveedor de mercado**: sería la fuente primaria real, con costo y probablemente con restricciones de redistribución que chocan con el criterio 5 y con el carácter público del sitio.

> **Revertido en v2.8: S2 fue dada de baja.** El párrafo siguiente registra la decisión original y por qué se tomó; el criterio que la reemplaza está en L18.

**S2 fue aprobada.** El requerimiento asociado queda firme: la UI rotula el indicador como *"EMBI+ J.P. Morgan, vía ArgentinaDatos"*, dejando visible que no es acceso directo al emisor (RF-9.4). Y como el agregador no tiene SLA, aplica RF-2.2: si cae, se muestra el error, no se sustituye en silencio.

## 5. Catálogo de indicadores

Todas las series de esta sección fueron **verificadas contra el dump oficial de metadatos** (`apis.datos.gob.ar/series/api/dump/series-tiempo-metadatos.csv`, 34.599 series) el 2026-08-27: existen, no están discontinuadas y tienen datos hasta la fecha indicada.

### 5.1 Indicadores con fuente aprobada

| Indicador | `serie_id` | Frec. | Cobertura | Unidad en la API | Escala |
|---|---|---|---|---|---|
| **Inflación (IPC)** | `148.3_INIVELNAL_DICI_M_26` | Mensual | 2016-12 → 2026-07 | Índice dic-2016=100 | — |
| ↳ tramo 2013-2015 | `98.3_INNG_2013_0_20` | Mensual | 2013-12 → 2015-10 | Índice oct-13=100 | — |
| ↳ tramo histórico | `96.3_ING_2008_M_19` | Mensual | 1993-01 → 2013-12 | Índice abr-2008=100 | — |
| **Pobreza** | `64.2_POBLACION_NUA_0_0_34_74` | Semestral | 2003-01 → 2025-07 | Porcentaje de población | **fracción** |
| **Tipo de cambio** | `175.1_DR_REFE500_0_0_25` | Diaria | 2002-03 → 2026-07 | ARS por USD | — |
| **Desempleo** | `42.3_EPH_PUNTUATAL_0_M_30` | Trimestral | 2003-01 → 2026-01 | Porcentaje | **fracción** |
| **Reservas BCRA** | `92.1_RID_0_0_32` | Mensual | 2003-01 → 2026-07 | Millones de USD | — |
| **Actividad económica (EMAE)** | `143.3_NO_PR_2004_A_21` | Mensual | 2004-01 → 2026-06 | Índice 2004=100 | — |
| ↳ desestacionalizado | `143.3_NO_PR_2004_A_31` | Mensual | 2004-01 → 2026-06 | Índice 2004=100 | — |
| **Salario registrado (RIPTE)** | `158.1_REPTE_0_0_5` | Mensual | 1994-07 → 2026-06 | Pesos corrientes | — |
| **Desigualdad (Gini)** | `65.1_CGI_0_0_21` | Trimestral | 2003-07 → 2026-01 | Coeficiente | — |
| **Empleo registrado privado** | `155.2_TLTAL_S_0_0_5` | Trimestral | 1996-01 → 2025-10 | Puestos de trabajo | — |
| **Índice de salarios** | `149.1_TL_REGIADO_OCTU_0_16` | Mensual | 2015-10 → 2026-04 | Índice | — |

**Escala "fracción":** la API devuelve estas tasas como fracción decimal (`0.282` = 28,2 %; `0.078` = 7,8 %). El modelo de datos debe declarar un factor de escala por serie y aplicarlo en la capa de ingesta, no en la de presentación.

### 5.2 IPC provinciales disponibles en la fuente aprobada

Publicados por direcciones provinciales de estadística y accesibles desde `apis.datos.gob.ar`. Relevantes porque **cubren con continuidad el período de intervención del INDEC** (§6, L2).

| Provincia | `serie_id` | Cobertura | Inflación anual 2007-2015 |
|---|---|---|---|
| **San Luis** | `197.1_NIVEL_GENERAL_2014_0_13` | 2005-10 → 2026-06 | 21,5 / 20,6 / 18,5 / 27,0 / 23,3 / 23,0 / 31,9 / 39,0 / 31,6 % |
| Tucumán | `199.1_NIVEL_GENERAL_2014_0_13` | 1968-01 → 2026-06 | 11,3 / 10,3 / 7,7 / 10,9 / 9,5 / 10,8 / 10,9 / 24,0 / 18,5 % |
| Mendoza | `195.1_NIVEL_GENERAL_0_0_13` | 1968-01 → 2026-06 | serie con hueco 2012-2016 |
| Neuquén | `196.1_NIVEL_GENERAL_2014_0_13` | 2001-11 → 2026-01 | a verificar |
| Chaco (Gran Resistencia) | `464.1_IPC_CHACO_NG_0_0_22_93` | 1960-01 → 2026-06 | a verificar |
| Córdoba | `194.1_NIVEL_GENERAL_2014_0_13` | 2013-07 → 2025-08 | no cubre el tramo |
| Santa Fe | `198.1_NIVEL_GENERAL_2014_0_13` | 2013-12 → 2026-06 | no cubre el tramo |
| CABA | `193.1_NIVEL_GENERAL_JULI_0_13` | 2012-07 → 2022-02 | parcial |

**San Luis es el único con cobertura continua desde 2005 y valores que difieren del dato nacional en todo el tramo.** Tucumán, en cambio, reproduce valores muy próximos a los del INDEC en 2009-2013, así que no aporta contraste. Ninguna de las dos reemplaza a la serie nacional: se ofrecen como series adicionales (RF-3.51).

### 5.3 Indicadores derivados (calculados por la aplicación)

| Indicador | Cálculo | Insumos |
|---|---|---|
| **Inflación mensual %** | Variación del índice IPC respecto al mes anterior | Serie IPC (§5.1) |
| **Inflación interanual %** | Variación del índice IPC respecto a 12 meses antes | Serie IPC (§5.1) |
| **Salario real** | RIPTE deflactado por IPC, expresado como índice base 100 en el primer mes del rango visible | RIPTE + IPC |

Los derivados deben calcularse en la aplicación y quedar marcados como tales en la UI. Alternativa aceptada para inflación: el parámetro nativo `representation_mode=percent_change` de la API, que devuelve la variación como fracción.

### 5.4 Indicadores habilitados por las fuentes S1 a S6

Todos entran al catálogo. Los tres primeros son construibles ya; los tres últimos esperan la resolución de URL de §4.6.

| Indicador | Fuente | Identificador / endpoint | Frec. | Cobertura | Estado |
|---|---|---|---|---|---|
| **Inflación mensual continua** | S1 BCRA | `monetarias/27` | Mensual | 2003-01 → 2026-07, **sin huecos** | Construible |
| **Inflación interanual** | S1 BCRA | `monetarias/28` | Mensual | 2003-01 → 2026-07 | Construible |
| **Reservas diarias** | S1 BCRA | `monetarias/1` | Diaria | 2014-04 → 2026-08 | Construible |
| **Tipo de cambio mayorista diario** | S1 BCRA | `monetarias/5` | Diaria | 2014-04 → 2026-08 | Construible |
| **Base monetaria** | S1 BCRA | `monetarias/15` | Diaria | 2014-04 → 2026-08 | Construible |
| **Riesgo país (EMBI+)** | ~~S2 ArgentinaDatos~~ | — | — | — | **Dado de baja (v2.8)** — sin fuente auditable |
| **Pobreza · comparación internacional** | S3 World Bank | `SI.POV.NAHC` | Anual | serie larga | Construible |
| **Gini · comparación internacional** | S3 World Bank | `SI.POV.GINI` | Anual | serie larga | Construible |
| **Indigencia (% de población)** | S4 INDEC | a resolver (§4.6) | Semestral | — | Bloqueado por URL |
| **Deuda pública** | S5 Finanzas | a resolver (§4.6) | — | — | Bloqueado por URL |
| **IPCBA** | S6 CABA | a resolver (§4.6) | Mensual | 2012-07 → | Bloqueado por URL; evaluar si San Luis alcanza |

**Decisión de fuente para la inflación (RF-0.5).** Con S1 aprobada hay dos fuentes para el mismo indicador. La resolución:

- La **serie mensual del BCRA** (`monetarias/27`) es la fuente de la **variación mensual y de la inflación acumulada por gestión**, porque es continua desde 2003 y no tiene el hueco de 2015-2016.
- Las **series de índice de `apis.datos.gob.ar`** siguen siendo la fuente del **nivel del índice** y de los empalmes por base, que el BCRA no expone.
- Ambas se declaran en el registro con su rango de validez, y el empalme queda marcado según P3.
- El tramo 2007-2015 conserva la advertencia de L2 con cualquiera de las dos: el BCRA arrastra el dato intervenido.

**Nota sobre indigencia.** Verificado de forma exhaustiva contra el dump: en `apis.datos.gob.ar` los datasets 61 y 62 —hogares y población bajo la línea de indigencia— solo tienen la distribución de **EPH puntual**, discontinuada en 2003-05. No existe la distribución de EPH continua que sí tienen los datasets 63 y 64 de pobreza. Es una asimetría real del catálogo, no un error de búsqueda: por eso S4 es indispensable para este indicador. La *línea* de indigencia en pesos (`150.1_LA_INDICIA_0_D_16`, 2016-04 → 2026-07) sí está, y se puede ofrecer como indicador distinto y correctamente rotulado, sin depender de S4.

### 5.5 Qué aporta CEDLAS / SEDLAC (S7)

Es además la fuente principal de la comparación internacional (§8.5): cubre **18 países de América Latina** —Argentina, Bolivia, Brasil, Chile, Colombia, Costa Rica, Ecuador, El Salvador, Guatemala, Honduras, México, Nicaragua, Panamá, Paraguay, Perú, República Dominicana, Uruguay y Venezuela— con el mismo procesamiento para todos.

SEDLAC —*Socio-Economic Database for Latin America and the Caribbean*— es elaborada por el CEDLAS de la Universidad Nacional de La Plata junto al Banco Mundial, procesando microdatos de encuestas de hogares con metodología armonizada para toda la región. Para Argentina la fuente son las encuestas del INDEC.

**Series verificadas para Argentina** (descargadas y parseadas el 2026-08-27):

| Serie | Planilla / hoja | Cobertura | Observaciones | Frecuencia |
|---|---|---|---|---|
| **Gini** del ingreso per cápita familiar | `2025_Act1_inequality_LAC.xlsx` · `gini1` | **1974 → 2024-I** | 60 | Anual hasta 2003, semestral desde 2003-II |
| **Pobreza extrema** USD 2,15/día | `2024_Act1_poverty_LAC.xlsx` · `poverty USD2.15` | 1986 → 2022-II | 55 | ídem |
| **Pobreza** USD 6,85/día | `2024_Act1_poverty_LAC.xlsx` · `poverty USD6.85` | 1986 → 2022-II | 55 | ídem |

El Gini de CEDLAS **arranca 29 años antes** que el de la fuente aprobada (`65.1_CGI_0_0_21`, desde 2003-07). Es el mayor aporte de S7.

**Las 16 planillas disponibles**, todas bajo `https://www.cedlas.econo.unlp.edu.ar/wp/wp-content/uploads/`:

`2024_Act1_poverty_LAC.xlsx` · `2025_Act1_inequality_LAC.xlsx` · `2025_Act1_incomes_LAC.xlsx` · `2025_Act1_employment_LAC.xlsx` · `2025_Act1_wages_hours_LAC.xlsx` · `2025_Act1_labor_benefits_LAC.xlsx` · `2025_Act1_demographics_LAC.xlsx` · `2025_Act1_enrollment_LAC.xlsx` · `2025_Act1_years_edu_LAC.xlsx` · `2025_Act1_literacy_LAC.xlsx` · `2025_Act1_housing_LAC.xlsx` · `2025_Act1_infrastructure_LAC.xlsx` · `2025_Act1_mobility_LAC.xlsx` · `2025_Act1_regions_migrations_LAC.xlsx` · `2025_Act1_surveys_LAC.xlsx` · `2025_Act1_construction_incomes_LAC.xlsx`

La v1 incorpora únicamente desigualdad y pobreza. El resto queda como catálogo relevado para fases posteriores; incorporar cualquiera requiere el mismo trabajo de parseo y declaración de quiebres.

**Estructura de las planillas.** Cada hoja lista los países en bloques. Dentro del bloque de Argentina las filas se agrupan por etiquetas de cobertura geográfica, y los períodos aparecen como año (`1998`) o como semestre (`2004-I`, `2004-II`). El parser debe contemplar ambas notaciones y las etiquetas de cobertura que empiezan con dígito, como `15 main cities`, o descartará silenciosamente parte de la serie.

**Corroboración independiente de L1.** Las series de CEDLAS también tienen el hueco de **2015-II y 2016-I**, faltantes en las tres series verificadas. Una institución académica procesando los microdatos llega al mismo agujero que la fuente oficial: confirma que el hueco es del dato, no de la API.

### 5.6 Indicadores calculados

Dos indicadores no los publica ninguna fuente: los calcula la aplicación al tomar la copia local, y quedan rotulados como calculados en la interfaz.

| Indicador | Cálculo | Insumos |
|---|---|---|
| **Brecha cambiaria** | Diferencia porcentual del dólar informal sobre el oficial | `usd_blue`, `usd_official` |
| **Salario real** | RIPTE dividido por un índice de precios construido con las variaciones mensuales del IPC, en base 100 | `ripte`, `inflation` |
| **Salario real · San Luis** | Igual, deflactando por el IPC de San Luis | `ripte`, `inflation_san_luis` |

El cálculo se hace en el script de copia y no en el navegador: así el dato publicado ya viene resuelto y la operación queda registrada en un solo lugar, con su procedencia.

**El salario real hereda las advertencias de su deflactor.** Es la consecuencia más fuerte de L2 y está declarada como quiebre del indicador: si el IPC de un tramo subestima la inflación, el salario real de ese tramo queda sobrestimado. Por eso se ofrece la variante deflactada por San Luis, para compararlas en el mismo panel.

### 5.7 Catálogo por categoría

77 indicadores, agrupados como los presenta el selector.

| Categoría | Cantidad | Ejemplos |
|---|---|---|
| Precios e inflación | 6 | IPC, núcleo, regulados, San Luis, serie larga desde 1943, canasta básica |
| Cambiario y financiero | 15 | Dólar blue, oficial, CCL, MEP, tarjeta, brecha, reservas, riesgo país, tasas, UVA, CER, base monetaria, crédito |
| Actividad y comercio | 5 | EMAE, variación interanual, construcción, exportaciones, importaciones |
| Trabajo y salarios | 10 | Desempleo, empleo registrado, RIPTE, salario real, índice de salarios, informalidad, horas |
| Ingresos y pobreza | 5 | Pobreza, Gini oficial, Gini y pobreza extrema de CEDLAS |
| Fiscal | 1 | Recaudación tributaria |
| Social y demografía | 11 | Cobertura jubilatoria y de salud, educación, alfabetización, vivienda, infraestructura, movilidad, migración, tamaño del hogar |
| Comparación internacional | 24 | Gini, pobreza, PBI per cápita, inflación y desempleo OIT para Argentina, Brasil, Chile, Uruguay y México |

### 5.8 Corregir por inflación o por tipo de cambio

Una serie en pesos corrientes crece por dos motivos a la vez: porque crece de verdad y porque los pesos valen menos. La recaudación tributaria sube todos los meses sin que eso signifique que se recaude más. Corregir separa una cosa de la otra.

| Corrección | Qué hace | Unidad resultante |
|---|---|---|
| **Por inflación** | `real(t) = nominal(t) × (P_último / P_t)`, con `P` el índice de precios acumulado a partir de las variaciones mensuales del IPC | pesos del último mes disponible |
| **En dólares** | Divide por el tipo de cambio de cada fecha, tomando la última cotización disponible en o antes de esa fecha | USD |

A diferencia de los indicadores calculados de §5.6, que se resuelven al tomar la copia, la corrección se aplica en el navegador sobre la serie que se está viendo: es una forma de mirarla, no otra serie, y por eso no genera un archivo propio.

## 6. Limitaciones conocidas de los datos

Estas limitaciones son propiedades de la realidad estadística argentina, no defectos a corregir. La aplicación debe **exponerlas**, y el documento las fija para que no se "resuelvan" inventando datos.

- **L1 — Hueco en el IPC de `apis.datos.gob.ar`: 2015-11 a 2016-04 en la variación mensual. Resuelto por S1.** El hueco del *índice* va de 2015-11 a 2016-03: el IPC-GBA se reanuda en 2016-04. Pero la *variación mensual* necesita el período anterior para calcularse, así que su primer valor disponible es 2016-05 y el hueco efectivo del indicador es de seis meses, no cinco. Verificado al componer la serie en F1. La serie `monetarias/27` del BCRA es continua de 2003-01 a 2026-07, con 283 de 283 meses presentes (verificado). El hueco deja de ser una limitación del producto. Lo que **no** desaparece es el quiebre: el empalme y el cambio de metodología subyacente se marcan igual, según P3 y §8.3.
- **L2 — El IPC 2007-2015 difiere marcadamente de las mediciones provinciales del mismo período.** El tramo corresponde al período de intervención del INDEC. **La aplicación muestra siempre la serie del INDEC completa y con sus valores publicados** (RF-3.50): no oculta, no reemplaza y no corrige ningún punto. Lo que ofrece es la posibilidad de graficar en el mismo panel las mediciones provinciales, y que la diferencia se vea. Medida sobre las propias fuentes:

  | Año | IPC oficial (dic/dic) | IPC San Luis (dic/dic) |
  |---|---|---|
  | 2007 | 8,4 % | 21,5 % |
  | 2008 | 7,1 % | 20,6 % |
  | 2009 | 7,3 % | 18,5 % |
  | 2010 | 10,5 % | 27,0 % |
  | 2011 | 9,2 % | 23,3 % |
  | 2012 | 10,6 % | 23,0 % |
  | 2013 | 10,7 % | 31,9 % |
  | 2014 | 23,7 % | 39,0 % |
  | 2015 | 18,5 % | 31,6 % |

  Aprobar S1 no cambia este tramo: la serie del BCRA reproduce el mismo dato del INDEC. El **IPC de San Luis** (§5.2) está disponible en la fuente aprobada y cubre 2005-2016 de forma continua; se ofrece como serie seleccionable adicional, rotulada como medición provincial. Las dos series conviven en el panel y el usuario compara.
- **L3 — Quiebres de base y cobertura en el IPC:** abr-2008, oct-2013, abr-2016 y dic-2016. Cada uno se marca sobre el gráfico según §8.3. Las variaciones porcentuales son comparables entre bases; los niveles del índice no lo son.
- **L4 — El IPC nacional cubre solo desde 2016-12.** Los tramos anteriores son IPC-GBA, de cobertura geográfica menor. El cambio de cobertura GBA → nacional es un quiebre y debe anotarse en el gráfico.
- **L5 — Pobreza y desempleo son de la EPH**, que cubre 31 aglomerados urbanos, no el total del país. La frecuencia es semestral y trimestral: no hay dato mensual y no debe simularse.
- **L6 — Cambio de la EPH en 2003.** Las series arrancan en 2003 por el pasaje de EPH puntual a continua. No hay comparabilidad estricta con datos previos.
- **L7 — Gestión en curso.** La gestión actual tiene un período incompleto. Cualquier métrica acumulada es no comparable con gestiones completas; la UI debe marcarla y ofrecer la versión anualizada.
- **L8 — Rezago de publicación.** Cada serie tiene su propio rezago (pobreza ~6 meses, EPH ~3 meses, IPC ~2 semanas). La UI muestra la fecha del último dato disponible por indicador.
- **L9 — Los snapshots no se actualizan solos.** Los datos que ingresen por RF-0.6 tienen la antigüedad de su última captura. La UI debe mostrar la fecha de captura, y el proceso de release debe incluir su refresco.
- **L10 — El sitio del INDEC hace soft-404.** Devuelve HTTP 200 con una página HTML de ~37 KB ante rutas de archivo inexistentes. Un script que solo mire el código de estado guardaría esa página como si fuera dato. De ahí RF-0.8: validar contenido y estructura, y fallar ruidosamente.
- **L18 — Un agregador no se puede auditar contra el emisor.** S2 se aprobó en su momento porque era el único acceso programático con CORS al EMBI+ y a las cotizaciones informales, y se aceptó el costo rotulando emisor y vía (RF-9.4). El costo real es otro: de un redistribuidor no se puede verificar qué publicó el emisor ni cuándo cambió de criterio, y las series informales no tienen emisor oficial contra el cual contrastar. El sitio ofrece «datos de fuentes oficiales y su metodología a la vista»; una serie que nadie puede auditar contradice esa promesa aunque el número sea correcto. De ahí la baja en v2.8. Nota: el tipo de cambio **oficial** no se pierde, porque el BCRA lo publica como Comunicación A 3500 (`exchange_rate`); lo que se pierde es el mercado informal, que ningún organismo releva.
- **L17 — Las fechas de cobertura del dump pueden ir por detrás de la API.** El dump de metadatos es autoritativo para saber si una serie existe y si sigue publicándose —para eso lo señala la documentación—, pero su columna de última fecha no siempre está al día: en la serie de pobreza informa 2025-07 mientras la API entrega hasta 2026-01. Por eso la actualidad se mide contra lo que efectivamente se descargó, no contra el dump.
- **L16 — Colapsar una serie diaria desplaza el dato en el tiempo.** La agregación `collapse=month&collapse_aggregation=end_of_period` de `apis.datos.gob.ar` devuelve el valor del **último día** del mes etiquetado con el **primer día** del mes. Con el tipo de cambio de diciembre de 2023 eso significaba atribuir 808,48 —resultado de la devaluación del 13 de diciembre— a una gestión que terminó el 10. El error no está en la API, que documenta lo que hace, sino en colapsar una serie cuya resolución temporal es justamente lo que importa para comparar entre gestiones. De ahí RF-1.4 y RF-1.12.
- **L15 — La comparabilidad internacional es limitada y hay que decirlo.** Cada país mide con su propia metodología, y el instrumento depende del indicador. En los que salen de encuestas de hogares —pobreza, desigualdad, informalidad— el instrumento es la encuesta de cada país: EPH continua en Argentina, PNAD y PNADC en Brasil, ENAHO en Perú, GEIH en Colombia, ENEMDU en Ecuador, ENCOVI en Guatemala. En otros es el sistema de cuentas nacionales, como el producto, o un índice de precios, como la inflación. Bases armonizadas como SEDLAC homogeneizan el procesamiento, no el instrumento, y las definiciones cambian con el tiempo dentro de cada país. La consecuencia práctica: conviene leer la evolución de cada serie antes que la diferencia de nivel entre países.
- **L12 — CEDLAS no mide lo mismo que el INDEC.** Su pobreza usa **líneas internacionales en USD PPP** (2,15 / 3,65 / 6,85 por día), no la línea de pobreza del INDEC basada en la canasta básica. Son indicadores distintos, no dos mediciones del mismo indicador. No se empalman ni se presentan como alternativa uno del otro (RF-0.10). Lo mismo vale para su Gini, calculado con metodología armonizada regional.
- **L13 — La cobertura geográfica cambia dentro de las series de CEDLAS.** Para Argentina: Gran Buenos Aires (1974-1992), 15 principales ciudades (1992-1998), 28 principales ciudades (1998-2003) y EPH continua (2003 en adelante). Los años de solape —1992 y 1998— traen dos valores distintos para el mismo año, medidos sobre coberturas distintas. Son cuatro quiebres a declarar según §8.3, y el solape debe verse, no promediarse.
- **L14 — Las planillas de CEDLAS tienen distinta actualidad.** La de pobreza es de la tanda 2024 y la serie argentina termina en **2022-II**: no cubre la gestión actual. La de desigualdad es de la tanda 2025 y llega a 2024-I. Cada planilla lleva su propia versión, registrada según RF-0.11.
- **L11 — La deuda pública no tiene archivo publicado.** Las páginas de la Secretaría de Finanzas alimentan sus gráficos desde una planilla embebida, no desde un archivo con URL estable, y el conjunto está rotulado 2004-2023. Es el indicador de disponibilidad más precaria del catálogo y puede terminar quedando fuera si no aparece una vía estable.

## 7. Metodología de comparación entre gestiones

Núcleo de la aplicación y donde está el mayor riesgo de producir un número incorrecto. **Requerimiento: la métrica agregada depende del tipo de indicador.**

### 7.1 Clasificación

| Tipo | Indicadores | Métricas válidas | Métricas prohibidas |
|---|---|---|---|
| **Tasa de flujo** | Inflación mensual | Acumulada del período (productoria), equivalente anualizada, máximo y mínimo mensual | Promedio aritmético de variaciones mensuales |
| **Nivel / stock** | Tipo de cambio, reservas, EMAE, RIPTE, empleo registrado, índice de salarios, salario real, deuda | Variación punta a punta, variación anualizada, máximo, mínimo, valor inicial y final | Promedio del nivel presentado como "el valor de la gestión" |
| **Tasa de estado** | Pobreza, desempleo, Gini, indigencia, riesgo país | Valor inicial, valor final, cambio en puntos porcentuales, promedio simple, máximo, mínimo | Variación porcentual relativa presentada sin aclarar (pasar de 5 % a 10 % es "+100 %" y "+5 p.p.") |

### 7.2 Fórmulas

- **Inflación acumulada** de un período con variaciones mensuales *r₁…rₙ*: `(∏(1 + rᵢ) − 1) × 100`
- **Equivalente anualizada** de una acumulada *A* sobre *m* meses: `((1 + A)^(12/m) − 1) × 100`
- **Variación punta a punta:** `(vfinal / vinicial − 1) × 100`, usando el primer y último dato **disponible** dentro del período (no el teórico).
- **Cambio en p.p.:** `vfinal − vinicial`

### 7.3 Asignación de datos a gestiones

- **RF-6.1** Cada gestión se define por fecha de inicio y fin (fecha de asunción del sucesor). Las fechas son las de asunción efectiva.
- **RF-6.2** Un punto pertenece a la gestión en cuya ventana `[inicio, fin)` cae. El intervalo es **cerrado a izquierda y abierto a derecha**, de modo que ningún punto se cuente en dos gestiones.
- **RF-6.3** Para series de frecuencia menor a mensual (trimestral, semestral), el punto se asigna según la fecha de inicio del período que representa. Cuando un período abarca una transición, la aplicación lo indica con una marca de "período a caballo" en la tabla.
- **RF-6.4** Una gestión con menos de 2 datos disponibles para el indicador no se muestra en la tabla comparativa; se lista aparte como "sin datos suficientes".
- **RF-6.5** La tabla indica siempre la cantidad de observaciones sobre la que se calculó cada fila.
- **RF-6.10** Cuando la cantidad de observaciones es menor a la que hace esperar la frecuencia declarada para el período, la fila lo indica con la cuenta esperada. Una métrica acumulada calculada sobre un período con huecos **no cubre todo el período**, y eso tiene que verse sin abrir el tooltip.
- **RF-6.6** Una gestión cuyo período **contiene un quiebre metodológico** se marca en la tabla, y su nota al pie advierte que la métrica cruza metodologías distintas.

### 7.4 Neutralidad

- **RF-6.7** No hay ordenamiento por resultado, ni resaltado de "mejor"/"peor", ni iconos de valoración. El orden por defecto de la tabla es cronológico.
- **RF-6.8** Cada indicador tiene un texto de metodología accesible desde la UI: qué mide, qué organismo lo publica, cómo se calculó la métrica agregada y qué limitaciones tiene.
- **RF-6.9** El color de cada gestión identifica a su fuerza política con el color de la propia fuerza: **celeste** para las gestiones peronistas (FPV / FdT), **amarillo** para el macrismo (Cambiemos / PRO), **violeta** para La Libertad Avanza. No es una escala de valoración y no se usan códigos semánticos verde/rojo.
- **RF-6.10** Las cuatro gestiones peronistas comparten el celeste y se distinguen entre sí por una rampa de luminosidad ordenada cronológicamente, de la más clara (2003) a la más oscura (2019). El apellido acompaña siempre al color.
- **RF-6.11** Ningún color de gestión se usa como color de texto sin verificar contraste AA contra el fondo. El amarillo en particular requiere una variante oscurecida para texto; como relleno de banda se usa el tono pleno con opacidad reducida.
- **RF-6.12** La paleta de gestiones se declara en el registro de gestiones, junto con las fechas. No se hardcodea en componentes.

### 7.5 Validación de la inflación acumulada (criterio de salida de F2)

Calculada el 2026-08-27 sobre la serie compuesta de §5.1, con la fórmula de §7.2. La columna de observaciones es parte del resultado, no un detalle:

| Gestión | Acumulada | Anualizada | Obs. | San Luis, acumulada |
|---|---|---|---|---|
| Néstor Kirchner | 44,1 % | 8,3 % | 55 | 33 % (serie recortada) |
| Cristina Fernández de Kirchner (I) | 40,3 % | 8,8 % | 48 | 124 % |
| Cristina Fernández de Kirchner (II) | 70,6 % | 15,0 % | 46 | 197 % |
| **Mauricio Macri** | **231,4 %** | **38,6 %** | **44 de 48** | 286 % |
| Alberto Fernández | 1.146,5 % | 87,9 % | 48 | 1.239 % |
| Javier Milei (en curso) | 241,8 % | 60,9 % | 31 | 201 % |

**Hallazgo: la gestión de Macri no tiene una acumulada completa.** El hueco del IPC —2015-12 a 2016-04 en la variación mensual— cae **dentro** de su período. La serie oficial no permite calcular su inflación acumulada completa, y el 231,4 % corresponde a 44 de los 48 meses. No es un defecto del cálculo sino de los datos disponibles, y la aplicación debe mostrarlo: de ahí RF-6.10.

Los valores de las gestiones sin huecos coinciden con el dato oficial publicado. Las cifras de San Luis se muestran a título comparativo, nunca sustituyen a la oficial (RF-3.51) y no participan de la tabla oficial.

## 8. Requerimientos funcionales

### 8.1 Ingesta de datos

- **RF-1.1** Las series se obtienen únicamente de hosts en estado `aprobada` del registro de fuentes (RF-0.2).
- **RF-1.2** Cada indicador se declara en un registro central con: id, etiqueta, descripción, unidad de presentación, tipo (§7.1), frecuencia, factor de escala, fuente, series que lo componen con su rango de validez, **quiebres metodológicos declarados** (§8.3) y organismo fuente.
- **RF-1.3** Las series se solicitan agrupadas cuando comparten fuente, frecuencia y rango, para reducir la cantidad de requests.
- **RF-1.4** **Se respeta la frecuencia de publicación de cada serie.** Una serie diaria se grafica con un punto por día, una mensual con uno por mes, y así. Está prohibido colapsar, remuestrear o reagregar una serie para uniformar frecuencias: el panel único ya sabe convivir con frecuencias distintas (RF-3.33).
- **RF-1.11** Cuando una serie excede el máximo de observaciones por respuesta de la fuente, el adaptador **pagina hasta agotarla**. Truncar una serie en silencio es inaceptable: la API de `apis.datos.gob.ar` topea en 5000 y se continúa con el parámetro `start`.
- **RF-1.12** La fecha de cada observación es la que le corresponde a su valor. Si una transformación de la fuente cambia el período que representa un punto, no puede conservarse la etiqueta original.
- **RF-1.13** Una serie cuya cadencia de publicación no es fija —encuestas que no se relevan todos los años— se declara con frecuencia `irregular`. El espacio entre observaciones es la cadencia del relevamiento, no un dato faltante, y no debe dibujarse como hueco ni contarse como observación ausente.
- **RF-1.5** El factor de escala declarado se aplica al ingresar el dato, dejando todo el resto de la aplicación trabajando en unidades de presentación.
- **RF-1.6** Los valores `null` que devuelva cualquier fuente se descartan, generando huecos según P2. No se rellenan.
- **RF-1.7** Las respuestas se cachean en `sessionStorage` con TTL de 24 h, con clave que incluya fuente, identificador de serie y parámetros. La caché se invalida si cambia la versión del registro de indicadores o del registro de fuentes.
- **RF-1.8** Toda solicitud es cancelable. Un cambio de rango o de indicador durante una carga en curso aborta la anterior; nunca puede una respuesta obsoleta sobreescribir un estado más nuevo.
- **RF-1.9** Cada fuente tiene su propio adaptador, que normaliza su respuesta al modelo interno de puntos. El resto de la aplicación no conoce la forma de respuesta de ninguna fuente concreta.
- **RF-1.10** Los snapshots (RF-0.6) se cargan como cualquier otra fuente y llevan su fecha de captura como metadato obligatorio.

### 8.2 Estados y errores

- **RF-2.1** Cada indicador tiene cuatro estados observables: cargando, con datos, sin datos para el rango, y error.
- **RF-2.2** El estado de error muestra el motivo en lenguaje claro, la fuente y el identificador de serie afectados, y un botón de reintento. Prohibido el fallback silencioso (P4).
- **RF-2.3** Si un indicador de una selección múltiple falla, los demás se siguen mostrando; el fallo se acota a su serie.
- **RF-2.4** La aplicación muestra por indicador la fecha del último dato disponible (L8) y, si viene de un snapshot, su fecha de captura (L9).

### 8.3 Notas metodológicas sobre el gráfico

Cuando cambia la metodología de medición de un indicador —cambio de base, de cobertura geográfica, de organismo o de metodología, como el pasaje al IPC nacional en dic-2016— **debe aclararse con una nota en el gráfico**.

- **RF-3.20** Los quiebres se declaran como **datos** en el registro de indicadores: fecha exacta, tipo de cambio (base / cobertura / organismo / metodología), texto corto para el gráfico y texto largo para la metodología. Nunca se hardcodean en el componente de gráfico.
- **RF-3.21** En cada fecha de quiebre el gráfico dibuja una **marca vertical visible con etiqueta legible sobre el gráfico mismo**. No alcanza con cambiar el trazo de la línea ni con mencionarlo solo en la leyenda o en un panel aparte.
- **RF-3.22** La etiqueta dice qué cambió y desde cuándo, en forma breve — por ejemplo *"dic-2016: IPC nacional, antes IPC-GBA"*. El texto completo está a un clic o en el tooltip.
- **RF-3.23** El tooltip, al posarse sobre un punto de un tramo con nota de contexto metodológico (L2), la repite en su forma factual.
- **RF-3.24** Los tramos de metodología distinta se distinguen además visualmente (trazo punteado o cambio de tono), de forma redundante con la marca, no en su lugar.
- **RF-3.25** Con varias series en el gráfico, las marcas de quiebre se atribuyen a su serie y no se superponen de forma ilegible. Si hay demasiadas, se agrupan y el detalle queda en el tooltip.
- **RF-3.26** La leyenda del gráfico enumera los quiebres visibles en el rango actual, con fecha y descripción corta.
- **RF-3.27** Las exportaciones PNG y CSV incluyen las notas de quiebre. Un gráfico compartido no puede perder la advertencia.

#### El dato oficial se muestra siempre

- **RF-3.50** La serie publicada por el organismo oficial se muestra **siempre completa y con sus valores publicados**, en todo su rango, incluido el tramo 2007-2015 del IPC. No se oculta, no se reemplaza, no se corrige y no se omite ningún punto.
- **RF-3.51** Las mediciones provinciales (§5.2) y las de fuentes académicas (§5.5) están disponibles como **series adicionales seleccionables**, nunca como sustituto de la oficial. El usuario puede graficarlas junto a la nacional en el mismo panel (§8.4) y ver la diferencia por sí mismo.
- **RF-3.52** La aplicación **no publica una serie "corregida", "empalmada" ni "ajustada"** de ningún indicador. Ninguna combinación de fuentes se presenta como el valor verdadero.
- **RF-3.53** La nota sobre un tramo con contexto metodológico particular es **factual**: dice qué ocurrió —por ejemplo, período de intervención del organismo, existencia de mediciones provinciales que difieren— y no instruye al usuario sobre qué creer. Enunciar el hecho y mostrar ambas series es el mecanismo; la conclusión es del lector (D4).

### 8.4 Selector de indicadores

- **RF-3.60** El selector va en una **columna a la izquierda** del panel, no en una fila sobre el gráfico: con decenas de indicadores una fila no es navegable.
- **RF-3.61** Los indicadores se agrupan, y el usuario elige el criterio: **por tipo de indicador** —qué mide— o **por fuente** —de dónde sale—. Con organismos oficiales, agregadores y una fuente académica conviviendo, saber la procedencia es tan importante como saber qué mide.
- **RF-3.62** Cada indicador muestra su unidad y su fuente en el propio selector, sin necesidad de seleccionarlo.
- **RF-3.63** Hay búsqueda por texto sobre etiqueta, descripción y unidad.
- **RF-3.91** Un panel puede quedar **sin ningún indicador**. Deseleccionar el último es una acción válida, no un caso a impedir: el botón **«eliminar indicadores»** los quita todos de una vez.
- **RF-3.92** Un panel vacío muestra que **falta la elección, no el dato**. Decir «sin datos para el período» ahí confundiría dos situaciones distintas: una es que la serie no cubre el rango, la otra es que no se eligió ninguna.
- **RF-3.93** Con el panel vacío los controles que no aplican —corrección, escala, exportación— quedan deshabilitados.
- **RF-3.94** Un panel vacío **se conserva en la URL** con sus opciones: vaciarlo no equivale a borrarlo.
- **RF-3.64** Los indicadores calculados se rotulan como tales en el selector.
- **RF-3.65** En pantallas angostas la columna se apila arriba del panel y no obliga a scroll horizontal (RF-10.1).

#### Color de las series

- **RF-3.66** El color de cada serie **no se elige a mano por indicador**: se asigna desde una paleta cualitativa. Con decenas de indicadores, elegir colores de a uno produce curvas casi indistinguibles en el mismo panel.
- **RF-3.67** **El color sigue al indicador, no a su posición en la selección.** Sumar o quitar una serie no repinta las demás.
- **RF-3.68** Dentro de una misma categoría los tonos no se repiten hasta agotar la paleta: los indicadores que se comparan entre sí son casi siempre de la misma categoría.
- **RF-3.69** La paleta se **valida con herramienta, no a ojo**: banda de luminosidad, piso de croma, separación para daltonismo, piso de visión normal y contraste mínimo 3:1 contra la superficie del gráfico. Verificado sobre el fondo real del sitio.
- **RF-3.70** **La identidad de una serie no puede depender del color.** Con selección arbitraria solo cuatro tonos separan todos los pares —verificado, no supuesto—, así que cada curva lleva su **etiqueta al final de la línea**, además de la leyenda. Las etiquetas que se solaparían se escalonan.

### 8.5 Panel único de comparación

El modo de uso central de la aplicación: el usuario elige **una cantidad de indicadores y una ventana de tiempo**, y todos se dibujan **en el mismo panel**.

- **RF-3.30** Todos los indicadores seleccionados se grafican en **un solo panel**. La aplicación no parte la vista en un gráfico por indicador ni en *small multiples*. Comparar en un mismo par de ejes es el propósito del producto.
- **RF-3.31** La cantidad de indicadores simultáneos no está limitada artificialmente. Si la legibilidad se degrada, la aplicación lo resuelve con recursos de diseño —etiqueta directa al final de cada línea, atenuación de las no señaladas, resaltado al pasar el mouse— no impidiendo la selección.
- **RF-3.32** La ventana de tiempo es **una sola** y se aplica a todas las series a la vez.
- **RF-3.33** Series de **frecuencias distintas** conviven en el mismo panel: diaria, mensual, trimestral, semestral y anual se dibujan cada una en sus propios puntos, sobre un eje temporal común. Está prohibido remuestrear, interpolar o rellenar para igualar frecuencias (P2).
- **RF-3.34** Cada serie se dibuja **en el rango donde tiene datos**, aunque otras del panel cubran más. Una serie que empieza más tarde arranca más tarde; no se rellena hacia atrás ni se recorta el panel a la intersección.
- **RF-3.35** Cuando las unidades difieren, rige la normalización a base 100 de RF-3.5. La base es el primer período visible **con dato en todas las series normalizadas**; si no existe tal período, cada serie usa su propio primer dato y la UI lo advierte.
- **RF-3.36** La identificación de cada serie no depende solo del color: etiqueta directa o interacción que la nombre (RF-10.2).

### 8.6 Comparación internacional

- **RF-3.40** El usuario puede agregar al panel el **mismo indicador para otros países** y compararlo con la serie argentina, en el mismo panel y con la misma ventana de tiempo (§8.4).
- **RF-3.41** Cuando el panel contiene más de un país, la aplicación muestra una **nota metodológica visible y permanente**, no un texto al pie. Es una **advertencia general sobre comparabilidad**, no una afirmación sobre los indicadores efectivamente elegidos: dice que cada país mide con su propia metodología y que por lo tanto los valores pueden no ser estrictamente comparables. No se puede descartar de forma permanente.
- **RF-3.41b** La nota **no puede afirmar cuál es el instrumento de medición**, porque varía según el indicador: encuesta de hogares para pobreza y desigualdad, cuentas nacionales para el producto, índice de precios para la inflación. Afirmar uno en particular sería incorrecto para los demás.
- **RF-3.42** Para comparación entre países se usan **series armonizadas** siempre que existan: SEDLAC (S7) para América Latina y World Bank (S3) para cobertura global. En este modo la armonización manda sobre la preferencia general por la fuente primaria nacional (RF-0.5).
- **RF-3.43** Comparar entre países series construidas con **metodología nacional propia** —cada país con su línea de pobreza, su canasta, su encuesta— está permitido pero **exige advertencia reforzada** que nombre la diferencia concreta, y esas series se marcan como no armonizadas en la leyenda.
- **RF-3.44** Cada serie de país declara, cuando la fuente lo expone, la **encuesta de origen** con la que se construyó. SEDLAC la publica por país y período.
- **RF-3.45** Los **cambios de encuesta dentro de un país** son quiebres metodológicos y se anotan sobre el gráfico según §8.3, igual que los argentinos.
- **RF-3.46** Las **bandas de gestión presidencial son de Argentina** y solo tienen sentido para su serie. Cuando el panel incluye más de un país, o se ocultan, o se rotulan explícitamente como correspondientes a Argentina. Nunca se sugiere que aplican a las series de otros países.
- **RF-3.47** Las tablas de comparación por gestión (§8.8) se calculan **solo sobre la serie argentina**. Un indicador de otro país no se parte por gestiones argentinas.
- **RF-3.48** El país se refleja en la URL compartible junto con el resto del estado (RF-7.1).
- **RF-3.49** La sección de metodología explica, por indicador, qué lo hace comparable o no comparable entre países.

### 8.7 Visualización

- **RF-3.1** Gráfico de líneas temporal con el rango seleccionado en el eje X.
- **RF-3.2** Bandas de color de fondo por gestión presidencial, con etiqueta del apellido, y líneas verticales punteadas en cada transición.
- **RF-3.3** Las bandas se calculan sobre el eje temporal real, no sobre índices de la serie. Una gestión cuyo período no tiene datos en el rango visible se dibuja igual (banda sin línea encima) o no se dibuja, pero **nunca desplazada** a un período que no le corresponde.
- **RF-3.4** Selección múltiple de indicadores en un mismo gráfico.
- **RF-3.5** Con unidades distintas, la normalización a base 100 es automática y no desactivable. Con unidades iguales, es opcional y por defecto está apagada.
- **RF-3.6** Al volver a un solo indicador, la normalización se apaga. Nunca se muestra un indicador único normalizado sin que el usuario lo haya pedido explícitamente.
- **RF-3.7** El tooltip muestra el período, el valor de cada serie con su unidad, y la gestión correspondiente a esa fecha.
- **RF-3.8** Las marcas de quiebre metodológico se rigen por §8.3.
- **RF-3.9** El formato del eje X se adapta al span del rango (años / mes-año), calculado sobre fechas parseadas sin ambigüedad de zona horaria.
- **RF-3.10** Escala del eje Y opcionalmente logarítmica, necesaria para series con crecimiento nominal de varios órdenes de magnitud (tipo de cambio, RIPTE).
- **RF-3.11** Los huecos de datos se ven como huecos: la línea se corta. Prohibido conectar por encima de un hueco.

### 8.8 Controles de rango

- **RF-4.1** Presets: gestión actual, cada gestión individual, últimos 12 meses, últimos 5 años, y serie completa.
- **RF-4.2** Selección manual de mes de inicio y mes de fin. El mes de fin es **inclusivo**: seleccionar un mes incluye todos sus días.
- **RF-4.3** Las etiquetas de los presets describen exactamente lo que hacen (*"últimos 12 meses"* no es lo mismo que *"año en curso"*).
- **RF-4.4** El rango por defecto se ajusta a la **unión** de las coberturas de los indicadores seleccionados, no a su intersección. Recortar a la intersección destruiría la vista al combinar series de distinta extensión —por ejemplo el Gini de CEDLAS desde 1974 con el índice de salarios desde 2015-10.
- **RF-4.6** Cuando dentro de la ventana elegida alguna serie no cubre todo el rango, la UI lo informa sin modificar la selección del usuario: indica desde y hasta cuándo hay dato para cada serie.
- **RF-4.7** Las gestiones presidenciales **se acumulan**: elegir una segunda no deselecciona la primera. Elegir Alberto Fernández y después Milei muestra los dos períodos. Volver a tocar una la saca.
- **RF-4.8** Con varias gestiones elegidas el rango va del inicio de la más antigua al fin de la más reciente. Si no son contiguas, el rango **incluye lo que hay en el medio**: en un eje temporal no se puede saltear el tiempo, y las bandas de las gestiones intermedias siguen ahí para ubicarse.
- **RF-4.9** Las gestiones elegidas se destacan en la leyenda, para distinguirlas de las que aparecen solo por caer dentro del rango.

#### Varios gráficos

- **RF-3.80** El usuario puede **agregar gráficos**. No todo tiene sentido en el mismo par de ejes: comparar inflación con reservas obliga a normalizar y pierde las unidades.
- **RF-3.81** Todos los gráficos comparten **una sola ventana de tiempo** (RF-3.32). Lo que cambia entre paneles es qué se dibuja, no cuándo.
- **RF-3.82** Cada gráfico tiene su propia selección de indicadores, su normalización, su escala y su corrección.
- **RF-3.83** Un gráfico se puede quitar. Siempre queda al menos uno.
- **RF-3.84** La cantidad de gráficos y la configuración de cada uno viajan en la URL (RF-7.1).

#### Corrección por inflación y por tipo de cambio

- **RF-3.85** Una serie en pesos corrientes se puede **corregir por inflación** —expresándola en pesos del último mes disponible— o **expresar en dólares**, dividiéndola por el tipo de cambio de cada fecha.
- **RF-3.86** La corrección se aplica **sobre lo que se dibuja**, no sobre el dato guardado: es una forma de mirar la serie, no otra serie.
- **RF-3.87** La unidad resultante se muestra y es una unidad real —«millones de ARS de 2026-07», «USD»— no un índice abstracto que haya que explicar.
- **RF-3.88** Solo se corrige lo que corresponde: una magnitud en pesos corrientes. Corregir una tasa, una variación porcentual o una serie ya expresada en dólares no produce nada interpretable, así que **se deja intacta y se explica por qué**.
- **RF-3.89** Las observaciones que quedan fuera —porque no hay inflación publicada para su mes, o son anteriores al inicio de la serie de tipo de cambio— **se informan con su cantidad**, no se descartan en silencio.
- **RF-3.90** El control queda deshabilitado, con su motivo, cuando ninguna serie del panel es corregible.

#### Vista acumulada

- **RF-3.95** Una serie de **variaciones por período** se puede ver como **acumulado**: en lugar de cuánto cambió cada mes, cuánto cambió en total. Se compone, no se suma: diez por ciento en enero y diez en febrero son veintiuno, no veinte.
- **RF-3.96** El acumulado se expresa como índice con **base 100 al inicio del período visible**. Dos series arrancan las dos en 100, así que la distancia entre las curvas se lee sin cuentas.
- **RF-3.97** Solo se acumula lo que es una variación de un período al siguiente. Acumular un tipo de cambio, un índice o una tasa de desempleo no significa nada, así que esas series quedan intactas y el control se deshabilita si ninguna del panel es acumulable.
- **RF-3.98** El resultado **coincide con la métrica acumulada de las tablas** (§7.2). Si difirieran, el número del gráfico y el de la tabla se contradirían; un test lo verifica.
- **RF-3.99** Las **tablas de comparación por gestión siguen recibiendo la serie sin acumular**: ya componen por su cuenta, y calcular sobre valores acumulados sería componer dos veces. La corrección por inflación o por dólar sí les llega, porque ahí sí corresponde.
- **RF-3.100** Cuando el rango tiene períodos sin dato, el acumulado **queda por debajo del real** —componer sobre un hueco afirmaría que no hubo variación— y el panel lo advierte.
- **RF-4.5** Las fechas se calculan en zona horaria local de Argentina; no puede haber desfase de un día por conversión UTC.

### 8.9 Comparación por gestión

- **RF-5.1** Tabla por indicador con una fila por gestión, mostrando las métricas válidas para su tipo (§7.1) y la cantidad de observaciones.
- **RF-5.2** Encabezados de columna que nombran la métrica con precisión (*"Inflación acumulada"*, *"Variación punta a punta"*), no rótulos genéricos.
- **RF-5.3** La gestión en curso se marca explícitamente como incompleta, con su duración transcurrida (L7).
- **RF-5.4** Cada tabla incluye una nota al pie con la metodología aplicada, la fuente y enlace a la explicación completa.

### 8.10 Compartir y exportar

- **RF-7.1** El estado completo (indicadores seleccionados, rango, normalización, escala) se refleja en la URL. Pegar la URL reproduce exactamente la vista.
- **RF-7.2** Exportar el gráfico como PNG, con las notas de quiebre incluidas (RF-3.27).
- **RF-7.3** Exportar los datos de la vista como CSV, incluyendo una cabecera con fuente e identificador de cada serie, la fecha de consulta, las notas de quiebre y la URL de la fuente (P1).
- **RF-7.4** Metadatos Open Graph para que el link muestre una previsualización al compartirse.

### 8.10 Carga de series por CSV — función administrativa

La carga de series por CSV **no es una función del usuario final**. Es una tarea de administración: incorporar una serie al catálogo es un acto con consecuencias sobre la trazabilidad (P1), y el visitante de un sitio público no debe poder inyectar datos que se grafiquen junto a series oficiales.

- **RF-8.1** El público **no puede cargar series**. La aplicación pública no expone ningún control de carga de archivos.
- **RF-8.2** Un **administrador** puede incorporar una serie desde un CSV con columnas de fecha y valor, a través de un backoffice restringido al que el público no tiene acceso.
- **RF-8.3** Una serie cargada por esta vía entra al **registro de fuentes** como cualquier otra, con su propio estado (§4.1) y su nivel. No hay atajo: si no está aprobada, no se consulta (RF-0.2).
- **RF-8.4** Cada serie cargada lleva **procedencia obligatoria**, con el mismo estándar que un snapshot (RF-0.9): quién la cargó, cuándo, desde qué archivo, con qué hash, cuántas filas, y qué organismo o metodología la produce.
- **RF-8.5** Una serie cargada por el administrador se muestra **siempre visualmente diferenciada y rotulada con su origen**. No se mezcla con una serie oficial ni participa de las tablas comparativas oficiales sin que su origen esté declarado en la UI.
- **RF-8.6** El parser acepta `date`/`fecha` y `value`/`valor`, en formatos `YYYY-MM-DD`, `YYYY-MM`, `DD/MM/YYYY` y `MM/YYYY`, y números en formato argentino (`1.234,56`) y anglosajón (`1234.56`).
- **RF-8.7** Los errores de parseo indican el número de fila y el motivo, y **rechazan la carga completa**: no se acepta una serie parcialmente parseada.
- **RF-8.8** El administrador puede dar de baja una serie cargada. La baja queda registrada igual que el alta.
- **RF-8.9** Límite de tamaño de archivo validado antes de parsear, con mensaje claro al excederse.
- **RF-8.10** Toda alta y baja de series queda en un **registro de auditoría** consultable, con autor y fecha.

#### 8.10.1 Mecanismo del backoffice — decidido: opción A

**Decisión tomada el 2026-08-27: opción A, backoffice por repositorio.** El administrador corre un script del repositorio que valida el CSV, lo normaliza, genera el archivo de procedencia y lo commitea; el deploy publica la serie. La autenticación es la del repositorio y la auditoría de RF-8.10 es el historial de git. **RNF-1 queda firme: no hay backend.**

Las dos opciones evaluadas:

| | **A · Backoffice por repositorio** (recomendada) | **B · Backoffice con backend** |
|---|---|---|
| Cómo funciona | El administrador corre un script del repositorio que valida el CSV, lo normaliza, genera el archivo de procedencia y lo commitea. El deploy publica la serie. | Aplicación con login, formulario de carga, base de datos y almacenamiento de archivos. |
| Autenticación | La del repositorio: quien puede commitear, puede cargar. | Propia, a construir y mantener. |
| Auditoría (RF-8.10) | El historial de git, gratis y a prueba de manipulación. | A construir. |
| Respeta RNF-1 (sin backend) | Sí | **No.** Obliga a revisar RNF-1, el modelo de deploy y la seguridad. |
| Reutiliza lo ya especificado | Sí: es el mismo script de snapshot de RF-0.6 con otra entrada. | No, es infraestructura nueva. |
| Carga sin conocimiento técnico | No: requiere acceso al repositorio. | Sí: cualquiera con credencial de administrador. |

**Por qué A.** Cumple todo lo pedido —solo un administrador carga, con procedencia y auditoría— sin introducir backend, sin superficie de autenticación que asegurar y reutilizando el script de snapshot que F3b ya construye. La opción B solo se justifica si la carga la va a hacer alguien sin acceso al repositorio, o si hace falta cargar series con frecuencia alta.

### 8.12 Transparencia

- **RF-9.1** Página o panel de metodología con: registro de fuentes y su estado, identificador de cada serie, fórmulas de §7.2, quiebres declarados y las limitaciones de §6 en lenguaje llano.
- **RF-9.2** Cada indicador muestra su organismo fuente, el nivel de la fuente (§4.3) y enlace al dataset de origen.
- **RF-9.3** Un aviso permanente y visible aclara de qué fuentes provienen los datos y que la aplicación no los modifica más allá de los cálculos declarados.
- **RF-9.4** Los indicadores que provienen de un agregador (§4.3) se rotulan indicando emisor y vía — por ejemplo *"EMBI+ J.P. Morgan, vía ArgentinaDatos"*. **Desde v2.8 no hay ninguna fuente de nivel agregador en el registro**, así que la regla no tiene hoy a qué aplicarse; se conserva porque es la condición que tendría que cumplir cualquier agregador que se admitiera en el futuro.
- **RF-9.5** La aplicación tiene una **sección dedicada de fuentes de datos**, accesible desde la navegación principal, que enumera todas las fuentes utilizadas y **provee el link a cada una**.
- **RF-9.6** Cada entrada incluye: organismo, nivel de fuente, qué indicadores aporta, identificadores de serie, condiciones de uso, fecha de última verificación y **enlace directo** a la API, al dataset o a la publicación de origen.
- **RF-9.7** Cuando la fuente lo permite, el enlace es profundo: apunta al dataset o a la serie concreta, no solo al home del organismo.
- **RF-9.8** La sección de fuentes se **genera desde el registro de fuentes**, no se escribe a mano. No puede desincronizarse del dato que la aplicación efectivamente consulta.
- **RF-9.9** Todo indicador enlaza desde su propia ficha a la entrada correspondiente de la sección de fuentes.
- **RF-9.10** Los enlaces se verifican en el proceso de release; un enlace roto es un defecto, no un detalle.

#### Glosario de las marcas

- **RF-9.11** Toda marca que aparece junto a un número —«en curso», «quiebre», «a caballo», «recortado», «faltan N», «calculado»— es un **botón que lleva a su explicación**, no un texto con `title`. Un `title` no se ve en un teléfono ni se alcanza con el teclado: quien no usa mouse no tenía forma de saber qué significaba.
- **RF-9.12** El glosario vive en el panel de metodología, con un ancla por término. Al llegar desde una marca, el término queda **destacado y con el foco puesto**, para que también lo encuentre quien usa lector de pantalla.
- **RF-9.13** Cada entrada dice tres cosas: qué significa, **por qué cambia la lectura del número** que tiene al lado, y cuando ayuda, un ejemplo concreto.
- **RF-9.14** El encabezado de la columna de observaciones también lleva al glosario: la notación «44/48» no se explica sola.
- **RF-9.15** Un test verifica que toda marca usada en la interfaz tenga su entrada en el glosario. Agregar una marca sin explicarla hace fallar el build.

### 8.13 Accesibilidad y presentación

- **RF-10.1** Responsive real desde 360 px de ancho. En móvil el gráfico es legible y las tablas hacen scroll horizontal contenido, sin que la página scrollee horizontalmente. Las notas de quiebre siguen siendo legibles en móvil.
- **RF-10.2** Contraste mínimo AA. La información no se transmite solo por color: cada serie tiene además etiqueta directa o patrón de trazo.
- **RF-10.3** Selectores y controles operables por teclado, con foco visible.
- **RF-10.4** Los datos del gráfico son accesibles como tabla para lectores de pantalla, y las notas de quiebre son texto accesible, no solo dibujo.
- **RF-10.5** Números formateados en `es-AR` (coma decimal, punto de miles), con cantidad de decimales apropiada por indicador.

## 9. Requerimientos no funcionales

- **RNF-1** Aplicación estática, desplegable en cualquier hosting de archivos. **Sin backend propio.** Las fuentes sin CORS se resuelven por snapshot (RF-0.6), no por proxy, y el backoffice de §8.10 es por repositorio (opción A), no un servicio.
- **RNF-2** Bundle inicial ≤ **1 MB gzip**. Medición al cierre de F0: **172,88 kB gzip** (596,80 kB sin comprimir), de los cuales unos 118,6 kB son la librería de gráficos y 54,26 kB el resto —React, date-fns y el código propio—. El techo deja margen amplio: la librería de gráficos es un costo fijo que no crece al sumar indicadores, y los datos se piden en tiempo de ejecución, no se empaquetan. Lo único que puede crecer de forma apreciable son los snapshots de RF-0.6 si se importan estáticamente; cuando eso pase, se cargan como archivos aparte bajo demanda.
- **RNF-3** First Contentful Paint < 2 s en 3G simulada.
- **RNF-4** `npm run lint` y `npm run build` deben pasar sin errores. Requiere crear el `eslint.config.js` que hoy falta (ESLint 10 ya no lee `.eslintrc`).
- **RNF-5** Tests unitarios obligatorios sobre la capa de cálculo: escalado de fracciones, inflación acumulada y anualizada, asignación de puntos a gestiones incluido el borde de transición, empalme de series con quiebre de base, y parseo de CSV.
- **RNF-6** Test que verifique que **ningún indicador referencia una fuente no aprobada** (RF-0.2). Debe fallar el build.
- **RNF-6b** Test que verifique que el bundle público **no contiene ningún control ni ruta de carga de archivos** (RF-8.1).
- **RNF-7** Tipado estricto sin `any` en la capa de datos. La respuesta de cada fuente se valida en runtime antes de usarse, no solo se castea.
- **RNF-8** El registro de indicadores y el de fuentes son la única fuente de verdad sobre series, escalas, quiebres y hosts permitidos. Agregar un indicador no debe requerir tocar componentes de UI.
- **RNF-9** Textos de la interfaz en español, con posibilidad de extraerlos a un archivo de mensajes.
- **RNF-10** El script de snapshot es reproducible y deja registro de qué descargó, cuándo y desde dónde.

## 10. Fuera de alcance (v1)

- Proyecciones, pronósticos o escenarios.
- Estimaciones privadas de inflación (IPC Congreso, consultoras) — rechazadas en §4.5.
- Desagregación regional o por aglomerado, salvo los IPC provinciales de §5.2 usados como serie alternativa explícita.
- Correlaciones, regresiones u otro análisis estadístico inferencial entre indicadores o entre países.
- Cuentas de usuario **para el público**, vistas guardadas del lado del servidor, comentarios. El acceso administrativo de §8.10 no es una cuenta de usuario público: su alcance y mecanismo se definen en §8.10.1.
- Backend propio o proxy de datos.
- Indicadores cuya fuente quedó bloqueada por falta de URL estable, si no se resuelve en F3b (§4.6). Se documenta el motivo en lugar de entregarlos incompletos.

## 11. Fases de entrega

**Estado al 2026-08-28: F0 a F5 completas.** 109 tests, `tsc`, `lint` y `build` en verde. 18 indicadores con copia local verificada.


| Fase | Contenido | Criterio de salida |
|---|---|---|
| **F0 — Cimientos** | Registro de fuentes con su control mecánico, registro de indicadores, adaptador de `apis.datos.gob.ar` tipado y validado, escalado, caché, cancelación, manejo de errores, `eslint.config.js`, tests de cálculo. Borrado de `sampleData.ts`. | Los 4 indicadores originales traen dato real y los tests de cálculo y de fuentes aprobadas pasan. |
| **F1 — Visualización correcta** | Gráfico con bandas de gestión correctas, normalización con reset, tooltip, huecos visibles, **notas de quiebre sobre el gráfico (§8.3)**, eje log, estados de error en UI. | Ningún bug de §8.4 presente; el quiebre de dic-2016 y el hueco 2015-11/2016-03 se ven anotados en el gráfico. |
| **F2 — Comparación** | Métricas por tipo de indicador, tablas, notas metodológicas, marcado de gestión en curso, de períodos a caballo y de gestiones que cruzan quiebres. El IPC de San Luis queda disponible como serie adicional seleccionable, junto a la del INDEC (RF-3.51). | Inflación acumulada por gestión validada a mano contra el dato del INDEC. |
| **F3a — Fuentes con API** | Adaptadores de S1, S2 y S3. Inflación continua del BCRA como fuente de la variación mensual, riesgo país, comparación internacional. Los derivados de §5.3. | Los indicadores «construibles» de §5.4 cargan, con fuente, metodología y limitaciones documentadas. El rótulo de agregador de S2 está visible. |
| **F3b — Fuentes por snapshot** | Se arranca por **S7 CEDLAS**, que tiene URLs verificadas y sirve de caso de prueba del script de snapshot: Gini desde 1974 y pobreza por líneas internacionales. Después, resolución manual de URLs de S4, S5 y S6 (§4.6), con validación RF-0.8 y procedencia RF-0.9: indigencia y deuda pública. Comparación IPCBA contra San Luis para decidir si S6 hace falta. | Cada snapshot tiene procedencia registrada y falla ruidosamente ante un soft-404. Si una URL no se resuelve, el indicador queda fuera con el motivo asentado, no a medias. |
| **F4 — Público** | URL con estado, exportación PNG/CSV con notas, panel de metodología y de fuentes, Open Graph, accesibilidad, responsive, deploy. | Auditoría de accesibilidad AA y presupuesto de bundle cumplidos. |
| **F5 — Backoffice de carga** | Script de carga por repositorio (opción A), parser robusto, procedencia obligatoria, registro de auditoría, alta y baja, diferenciación visual. | Ninguna vía pública permite cargar series. Toda serie cargada tiene procedencia y queda auditada. Una serie cargada nunca puede confundirse con una oficial. |

## 12. Criterios de aceptación globales

La versión 1 se considera entregada cuando:

1. No existe en el repositorio ningún valor numérico de indicador hardcodeado.
2. Todo número visible tiene su fuente e identificador de serie rastreables desde la interfaz.
3. **Todo quiebre metodológico está anotado sobre el gráfico**, con fecha y descripción, y sobrevive a la exportación.
4. Ninguna fuente fuera del registro aprobado es consultada, verificado por test, y existe una sección de fuentes con enlace a cada una, generada desde el registro.
5. Los huecos de datos se ven como huecos y las limitaciones de §6 están documentadas en la UI.
6. Las métricas agregadas de cada indicador corresponden a su tipo según §7.1, verificadas por tests.
7. Un fallo de una fuente es visible para el usuario, con reintento y sin degradación silenciosa.
8. La URL reproduce cualquier vista de forma exacta.
9. Todo snapshot tiene archivo de procedencia y su script falla ante un soft-404, verificado por test.
10. Ninguna vía pública permite cargar series: la carga por CSV es exclusivamente administrativa y toda serie cargada tiene procedencia y auditoría.
11. `npm run lint`, `npm run build` y la suite de tests pasan en limpio.
12. La aplicación es usable en un teléfono de 360 px y cumple contraste AA.

---

## Anexo A — Gestiones presidenciales y paleta

| Gestión | Fuerza | Color | Asunción | Fin |
|---|---|---|---|---|
| Néstor Kirchner | FPV | `#9CCDEC` celeste claro | 2003-05-25 | 2007-12-10 |
| Cristina Fernández de Kirchner (I) | FPV | `#7BB6DF` celeste | 2007-12-10 | 2011-12-10 |
| Cristina Fernández de Kirchner (II) | FPV | `#559CCC` celeste medio | 2011-12-10 | 2015-12-10 |
| Mauricio Macri | Cambiemos | `#E8B923` amarillo | 2015-12-10 | 2019-12-10 |
| Alberto Fernández | FdT | `#3480B4` celeste oscuro | 2019-12-10 | 2023-12-10 |
| Javier Milei | LLA | `#8B45B5` violeta | 2023-12-10 | — (en curso) |

Celeste para el peronismo con rampa cronológica de claro a oscuro, amarillo para el macrismo, violeta para La Libertad Avanza. Son los colores de las propias fuerzas: identifican, no valoran (RF-6.9 a RF-6.12). Los valores son la referencia inicial; deben ajustarse si alguno no alcanza contraste AA en su uso final.

## Anexo B — Quiebres metodológicos conocidos

Los que deben quedar declarados en el registro de indicadores para que §8.3 los pueda dibujar.

| Indicador | Fecha | Tipo | Nota corta para el gráfico |
|---|---|---|---|
| Inflación | 2007-01 | Contexto metodológico | Comienza el período de intervención del INDEC; hay mediciones provinciales que difieren |
| Inflación | 2008-04 | Base | Nueva base IPC-GBA abr-2008=100 |
| Inflación | 2013-12 | Cobertura + base | IPCNu, cobertura urbana nacional, base oct-2013 |
| Inflación | 2015-11 | Interrupción | Se interrumpe la publicación oficial |
| Inflación | 2016-04 | Reanudación | Vuelve el IPC-GBA con nueva base |
| Inflación | 2016-12 | Cobertura | IPC nacional; antes solo GBA |
| Pobreza / Desempleo | 2003-01 | Metodología | EPH continua; antes EPH puntual |
| EMAE | 2004-01 | Base | Base 2004=100 |
| Índice de salarios | 2015-10 | Inicio de serie | Serie nueva, sin continuidad previa |
| CEDLAS (Gini y pobreza) | 1992 | Cobertura | De Gran Buenos Aires a 15 principales ciudades |
| CEDLAS (Gini y pobreza) | 1998 | Cobertura | De 15 a 28 principales ciudades |
| CEDLAS (Gini y pobreza) | 2003-II | Cobertura + frecuencia | EPH continua, 31 aglomerados; pasa de anual a semestral |
| CEDLAS (Gini y pobreza) | 2015-II | Interrupción | Sin dato en 2015-II ni 2016-I |

## Anexo C — Notas de verificación técnica

Relevado el 2026-08-27.

**`apis.datos.gob.ar`**
- Los tres `serie_id` que usa el código actual **fallan**: `148.3_INIVELGENERAL_DICI_M_26` y `41.1_DNTOSED_DNAS_M_32` devuelven `Serie inexistente`, y la consulta de tipo de cambio falla por `collapse_aggregation=last`, valor que la API no acepta. El único aggregation válido para el caso es `end_of_period`.
- El endpoint `/series` responde `301` sin seguir redirecciones; el cliente debe seguirlas.
- `limit` acepta valores por encima de 1000 sin error.
- `representation_mode=percent_change` devuelve variaciones como fracción decimal.
- El dump `apis.datos.gob.ar/series/api/dump/series-tiempo-metadatos.csv` (~25 MB, 34.599 series) es la fuente autoritativa para verificar existencia y vigencia. La documentación de la API lo señala como el lugar donde están los identificadores de serie. **Ya no se consulta a mano**: lo verifica `npm run verificar-series`, que corre en el job diario (RF-0.14). Sus fechas de cobertura pueden atrasarse respecto de la API (L17).

**Serie del tipo de cambio, verificado el 2026-08-27**
- `175.1_DR_REFE500_0_0_25` publica **8916 observaciones diarias** entre 2002-03-04 y 2026-07-31, sin un solo día faltante.
- En el traspaso: 364,41 el 8 al 10 de diciembre de 2023, 366,00 el 11, 366,50 el 12 y **799,98 el 13**. La devaluación ocurre tres días después de la asunción.
- Con la serie diaria, la asignación a gestiones queda: Alberto Fernández 1461 observaciones, de 59,96 a 364,41, con máximo 364,41; Milei desde 364,41 hasta 1488,45.
- La API topea en 5000 observaciones por respuesta y continúa con `start`.

**`api.bcra.gob.ar` (S1)**
- La v3.0 está deprecada y devuelve HTTP 410. La vigente es **v4.0**: `GET /estadisticas/v4.0/monetarias` lista 1.610 variables; `GET /estadisticas/v4.0/monetarias/{id}?desde=&hasta=&limit=` devuelve la serie.
- La respuesta anida los puntos en `results[0].detalle`, ordenados de más reciente a más antiguo.
- CORS `*`. Variables relevantes: `1` reservas (diaria, desde 2014-04), `4` y `5` tipo de cambio (diaria, desde 2014-04), `15` base monetaria, `27` inflación mensual %, `28` inflación interanual %.
- La serie `27` cubre 2003-01 a 2026-07 con **283 de 283 meses presentes: sin huecos**. Su acumulado anual 2007-2013 es de 7 % a 11 %, es decir arrastra el dato intervenido.

**`api.argentinadatos.com` (S2)**
- `GET /v1/finanzas/indices/riesgo-pais` devuelve 7.686 puntos diarios, 1999-01-22 → 2026-08-24. CORS `*`.

**`api.worldbank.org` (S3)**
- `GET /v2/country/ARG/indicator/{codigo}?format=json` funciona con CORS `*`. Códigos útiles: `SI.POV.NAHC` pobreza nacional, `SI.POV.GINI` Gini.

**Sin CORS (requieren snapshot, RF-0.6):** `indec.gob.ar`, `estadisticaciudad.gob.ar`, `argentina.gob.ar`. Ninguna URL de descarga estable pudo resolverse en el relevamiento; ver §4.6.
- `indec.gob.ar` devuelve una página shell de ~37 KB para toda ruta profunda, y **HTTP 200 con HTML** ante archivos inexistentes (soft-404). Cinco rutas plausibles de cuadros de pobreza probadas, las cinco devolvieron la misma página.
- `argentina.gob.ar/economia/finanzas/graficos-deuda` tiene subpáginas reales por desagregación, pero ningún archivo descargable: el gráfico se alimenta de una planilla embebida vía iframe.
- `estadisticaciudad.gob.ar/eyc/?p=27519` responde 301.
- El CKAN de `datos.gob.ar` (`/api/3/action/package_search`) **no envía CORS**, a diferencia de la API de series. Confirma que para indigencia solo existe la distribución de EPH puntual.

**`cedlas.econo.unlp.edu.ar` (S7)**
- La página de estadísticas SEDLAC enlaza **16 planillas xlsx** y 5 zip históricos, todas bajo `/wp/wp-content/uploads/` con nombre versionado por tanda (`2025_Act1_*`, `2024_Act1_poverty`).
- **Sin CORS**, pero las descargas devuelven `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` y abren correctamente: no hay soft-404 como en INDEC. Descargadas y parseadas con éxito: pobreza (2,3 MB) y desigualdad (1,8 MB).
- Estructura: cada hoja lista países en bloques; dentro de Argentina las filas se agrupan por etiqueta de cobertura y los períodos son año (`1998`) o semestre (`2004-I`). **Trampa de parseo verificada:** etiquetas de cobertura como `15 main cities` empiezan con dígito; un parser que asuma «si empieza con número es un período» las descarta en silencio y atribuye años a la cobertura equivocada. Detectado y corregido durante el relevamiento.
- Series argentinas confirmadas: Gini 1974 → 2024-I (60 obs.), pobreza USD 2,15 y USD 6,85 1986 → 2022-II (55 obs. cada una). Faltan 2015-II y 2016-I en las tres.

**Bloqueada:** `mercados.ambito.com` devuelve HTTP 403 por política de seguridad.

## Anexo D — Hallazgos de la construcción

Cosas que solo aparecieron al escribir el código y que cambiaron el documento.

**El colapso mensual desplazaba el dato en el tiempo (L16).** `collapse_aggregation=end_of_period` devuelve el valor del último día del mes etiquetado con el primero. En diciembre de 2023 eso atribuía a Alberto Fernández una devaluación ocurrida el día 13, ya bajo la gestión siguiente. Corregido eliminando todo colapso: cada serie se grafica con su frecuencia de publicación.

**La serie de inflación registrada devolvía el índice, no la variación.** El indicador decía «% mensual» y llevaba niveles del índice, lo que habría corrompido la inflación acumulada por gestión. Corregido con `representation_mode=percent_change` y cuatro tramos empalmados.

**Un eje categórico desplaza las bandas de gestión.** Con las fechas como etiquetas, una banda que empieza el 10 de diciembre solo se ubica bien si existe un dato ese día. Con series mensuales quedaba corrida. Corregido pasando a eje temporal en milisegundos.

**La caché servía dato viejo tras un arreglo.** La clave no incluía nada que cambiara al modificar la ingesta. Ahora deriva de la definición completa del indicador más un número de versión de ingesta.

**`StrictMode` dejaba la carga colgada.** El doble montaje de efectos abortaba el primer pedido y una guarda de deduplicación impedía el segundo. Corregido: la cancelación se resuelve ignorando resultados obsoletos, no abortando una lectura compartida.

**Mezclar frecuencias exige segmentar.** Una serie trimestral junto a una mensual desaparece si se corta la línea en cada fecha sin dato. Se conecta a través de las fechas donde la serie no mide y se corta donde falta un período esperado. Las series de días hábiles necesitan además un umbral que tolere los fines de semana.

**No todas las encuestas se relevan todos los años.** El Gini de Chile se publica cada dos o tres años; con umbral anual cada observación quedaba aislada. De ahí la frecuencia `irregular` (RF-1.13).

**CEDLAS mezcla cadencias y solapa coberturas.** Su Gini es anual hasta 2003 y semestral después, y los años de cambio de cobertura —1992 y 1998— traen dos valores para el mismo año. Se declara la cadencia más espaciada y se conserva la medición de la cobertura que continúa, informando cuántas quedaron fuera.

**El Banco Mundial no publica pobreza por línea nacional para Brasil.** Se omite esa combinación en lugar de dejar un indicador que siempre falla.

**Desvío respecto de lo pedido.** Se pidió que «el primer request del día» traiga el dato de la API y lo guarde en la aplicación. Eso exige que la aplicación escriba en el servidor, y no hay backend (RNF-1). El objetivo —no actualizar nada a mano— se cumple con el job programado de RF-0.12, que además es determinista y no depende de que llegue un visitante.

**El salario real depende enteramente del deflactor que se elija.** Al construirlo apareció el efecto más fuerte de L2. Deflactando el RIPTE por el IPC oficial, el salario real se multiplica por 5,4 entre 2003 y 2019 —un resultado implausible—. Deflactando por el IPC de San Luis, que no se interrumpe ni cambia de metodología en ese tramo, pasa de 100 a 107: prácticamente plano. La diferencia no está en el cálculo sino en el deflactor. Se publican las dos variantes, con la advertencia declarada como quiebre del indicador, en lugar de elegir una y presentarla como el salario real.

**La brecha cambiaria no existe en fuentes oficiales — y desde v2.8 no se construye.** Ningún organismo publica la cotización informal. Se calculaba a partir de las cotizaciones que redistribuía ArgentinaDatos, rotulada como tal; dada de baja esa fuente (L18), el indicador se retira: no hay cotización informal auditable con la que construirlo. El operador `brecha` se conserva en el motor de cálculo, sin usuarios. Los valores obtenidos son consistentes con lo conocido: 225,6 % de máximo en octubre de 2023, 147 % en el traspaso de diciembre de 2023, y 1,3 % con el mercado unificado.
