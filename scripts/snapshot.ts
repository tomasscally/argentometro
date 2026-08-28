/**
 * Toma una copia local de las series de todos los indicadores del registro y la
 * deja en `public/data/`, para que la aplicación no tenga que consultar las
 * APIs en cada visita (RF-0.6).
 *
 * Se corre a mano o antes de un deploy:
 *   npm run snapshot
 *
 * Cada archivo lleva su procedencia: URL exacta, momento de la descarga, hash
 * del contenido y cantidad de filas (RF-0.9). Un snapshot sin procedencia no se
 * acepta, y una descarga que no traiga datos hace fallar el script en lugar de
 * escribir un archivo vacío (RF-0.8).
 */
import { createHash } from 'node:crypto'
import * as XLSX from 'xlsx'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { INDICATORS } from '../src/data/indicators'
import { SOURCES } from '../src/data/sources'
import type { DataPoint, Indicator, SeriesRef } from '../src/types'

const OUT_DIR = join(process.cwd(), 'public', 'data')
const PAGE_SIZE = 5000

interface Provenance {
  seriesId: string
  sourceId: string
  url: string
  rows: number
  sha256: string
}

async function getText(url: string): Promise<string> {
  // Las fuentes son lentas y a veces devuelven vacío: se reintenta antes de rendirse.
  let lastError = ''
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const text = await response.text()
      if (!text.trim()) throw new Error('respuesta vacía')
      // RF-0.8 — se valida que sea dato y no una página de error.
      if (text.trimStart().startsWith('<')) throw new Error('la respuesta es HTML, no JSON')
      return text
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      if (attempt < 4) await new Promise((r) => setTimeout(r, attempt * 3000))
    }
  }
  throw new Error(`no se pudo obtener ${url}: ${lastError}`)
}

async function getJson(url: string): Promise<unknown> {
  return JSON.parse(await getText(url))
}

/** Un adaptador traduce la respuesta de una fuente al modelo interno. */
type Adapter = (ref: SeriesRef) => Promise<{ points: DataPoint[]; url: string }>

// ── apis.datos.gob.ar ────────────────────────────────────────────────────────

function datosGobUrl(ref: SeriesRef, offset: number): string {
  const params = new URLSearchParams({
    ids: ref.seriesId,
    limit: String(PAGE_SIZE),
    start: String(offset),
    format: 'json',
    start_date: ref.validFrom,
  })
  if (ref.transform) params.set('representation_mode', ref.transform)
  return `https://apis.datos.gob.ar/series/api/series?${params.toString()}`
}

const datosGobAdapter: Adapter = async (ref) => {
  const rows: [string, number | null][] = []
  let firstUrl = ''
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const url = datosGobUrl(ref, offset)
    if (!firstUrl) firstUrl = url
    const body = (await getJson(url)) as Record<string, unknown>
    if (Array.isArray(body.errors)) {
      throw new Error(`la API rechazó ${ref.seriesId}: ${JSON.stringify(body.errors)}`)
    }
    if (!Array.isArray(body.data)) throw new Error(`respuesta sin "data" (${ref.seriesId})`)
    const page = body.data as [string, number | null][]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }
  return {
    url: firstUrl,
    points: rows
      .filter((r): r is [string, number] => r[1] !== null)
      .map(([date, value]) => ({ date: date.slice(0, 10), value })),
  }
}

// ── api.bcra.gob.ar ──────────────────────────────────────────────────────────

const BCRA_PAGE = 3000
const DAY_MS = 24 * 60 * 60 * 1000

function addDays(date: string, days: number): string {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10)
}

const bcraAdapter: Adapter = async (ref) => {
  const today = new Date().toISOString().slice(0, 10)
  const points: DataPoint[] = []
  let firstUrl = ''

  // La API topea en 3000 observaciones por respuesta y no admite `offset` en
  // este endpoint, así que se pagina por ventanas de fechas consecutivas.
  let desde = ref.validFrom
  while (desde <= today) {
    const hasta = addDays(desde, BCRA_PAGE - 1)
    const url =
      `https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/${ref.seriesId}` +
      `?desde=${desde}&hasta=${hasta > today ? today : hasta}&limit=${BCRA_PAGE}`
    if (!firstUrl) firstUrl = url

    const body = (await getJson(url)) as {
      results?: { detalle?: { fecha: string; valor: number }[] }[]
    }
    const detalle = body.results?.[0]?.detalle
    if (!Array.isArray(detalle)) {
      throw new Error(`BCRA no devolvió detalle para ${ref.seriesId}`)
    }
    points.push(...detalle.map((d) => ({ date: d.fecha.slice(0, 10), value: d.valor })))

    if (hasta >= today) break
    desde = addDays(hasta, 1)
  }

  return { url: firstUrl, points }
}

// ── api.argentinadatos.com ───────────────────────────────────────────────────

const argentinaDatosAdapter: Adapter = async (ref) => {
  // `#casa` selecciona un tipo de dólar dentro de la respuesta de cotizaciones.
  const [path, casa] = ref.seriesId.split('#')
  const url = `https://api.argentinadatos.com${path}`
  const body = (await getJson(url)) as {
    fecha: string
    valor?: number
    venta?: number
    casa?: string
  }[]
  if (!Array.isArray(body)) {
    throw new Error(`ArgentinaDatos no devolvió una lista (${ref.seriesId})`)
  }

  const rows = casa ? body.filter((d) => d.casa === casa) : body
  if (casa && rows.length === 0) {
    throw new Error(`ArgentinaDatos no tiene cotizaciones para "${casa}"`)
  }

  const points = rows
    .map((d) => ({ date: d.fecha.slice(0, 10), value: casa ? d.venta : d.valor }))
    .filter((p): p is { date: string; value: number } => typeof p.value === 'number')

  return { url, points }
}

// ── api.worldbank.org ────────────────────────────────────────────────────────

const worldBankAdapter: Adapter = async (ref) => {
  const country = ref.country ?? 'ARG'
  const url =
    `https://api.worldbank.org/v2/country/${country}/indicator/${ref.seriesId}` +
    `?format=json&per_page=500`
  const body = (await getJson(url)) as unknown[]
  const rows = body[1]
  if (!Array.isArray(rows)) throw new Error(`World Bank no devolvió datos (${ref.seriesId}/${country})`)
  return {
    url,
    points: (rows as { date: string; value: number | null }[])
      .filter((r) => typeof r.value === 'number')
      .map((r) => ({ date: `${r.date}-01-01`, value: r.value as number })),
  }
}

// ── CEDLAS / SEDLAC ──────────────────────────────────────────────────────────

const CEDLAS_BASE = 'https://www.cedlas.econo.unlp.edu.ar/wp/wp-content/uploads/'

/** Países del bloque LAC: su aparición cierra el bloque del país buscado. */
const LAC_COUNTRIES = new Set([
  'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Costa Rica',
  'Dominican Rep.', 'Dominican Republic', 'Ecuador', 'El Salvador', 'Guatemala',
  'Honduras', 'Mexico', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Uruguay',
  'Venezuela',
])

/** `1998` o `2004-I` / `2004-II`. */
const PERIOD = /^(\d{4})(?:-(I{1,2}))?$/

/**
 * Convierte el período de SEDLAC a fecha ISO. Los semestrales se ubican en el
 * primer mes del semestre que representan.
 */
function cedlasDate(year: string, half: string | undefined): string {
  if (!half) return `${year}-01-01`
  return half === 'I' ? `${year}-01-01` : `${year}-07-01`
}

/**
 * `seriesId` con formato `archivo.xlsx#hoja#País`.
 *
 * Cuidado con el parseo: dentro del bloque de un país las filas se agrupan por
 * etiquetas de cobertura geográfica, y algunas empiezan con dígito, como
 * `15 main cities`. Asumir que «si empieza con número es un período» descarta
 * esas etiquetas en silencio y atribuye años a la cobertura equivocada.
 */
const cedlasAdapter: Adapter = async (ref) => {
  const [file, sheetName, country] = ref.seriesId.split('#')
  const url = `${CEDLAS_BASE}${file}`

  const response = await fetch(url)
  if (!response.ok) throw new Error(`CEDLAS respondió HTTP ${response.status} (${file})`)
  const buffer = new Uint8Array(await response.arrayBuffer())
  // RF-0.8 — un HTML de error no es una planilla.
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error(`la descarga de ${file} no es un xlsx`)
  }

  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) throw new Error(`la planilla ${file} no tiene la hoja "${sheetName}"`)

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })

  const points: DataPoint[] = []
  let inCountry = false
  for (const row of rows) {
    const first = row?.[0]
    if (first === undefined || first === null) continue
    const label = String(first).trim()
    if (!label) continue

    if (label === country) {
      inCountry = true
      continue
    }
    if (!inCountry) continue
    if (LAC_COUNTRIES.has(label)) break

    const match = PERIOD.exec(label)
    if (!match) continue // etiqueta de cobertura, no un período

    const value = row[1]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    points.push({ date: cedlasDate(match[1], match[2]), value })
  }

  if (points.length === 0) {
    throw new Error(`no se encontraron observaciones de ${country} en ${file}#${sheetName}`)
  }

  /*
   * Los años en que cambia la cobertura aparecen dos veces, medidos sobre
   * poblaciones distintas: 1992 con Gran Buenos Aires y con 15 ciudades, 1998
   * con 15 y con 28. El gráfico admite un valor por fecha, así que se conserva
   * la última medición —la de la cobertura que continúa— y se informa cuántas
   * quedaron fuera, en lugar de descartarlas en silencio.
   */
  const byDate = new Map<string, number>()
  for (const point of points) byDate.set(point.date, point.value)
  const overlaps = points.length - byDate.size
  if (overlaps > 0) {
    console.log(`\n    (${overlaps} año(s) de solape de cobertura en ${sheetName}: se conserva la medición más reciente)`)
  }

  return {
    url,
    points: [...byDate.entries()].map(([date, value]) => ({ date, value })),
  }
}

const ADAPTERS: Record<string, Adapter> = {
  'datos-gob-ar': datosGobAdapter,
  bcra: bcraAdapter,
  argentinadatos: argentinaDatosAdapter,
  'world-bank': worldBankAdapter,
  cedlas: cedlasAdapter,
}

async function fetchRef(ref: SeriesRef): Promise<{ points: DataPoint[]; prov: Provenance }> {
  const adapter = ADAPTERS[ref.sourceId]
  if (!adapter) throw new Error(`sin adaptador para la fuente "${ref.sourceId}"`)

  const { points: raw, url } = await adapter(ref)
  const points = raw
    .map((p) => ({ date: p.date, value: p.value * ref.scale }))
    .filter(
      (p) => p.date >= ref.validFrom && (ref.validTo === null || p.date < ref.validTo)
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  if (points.length === 0) {
    throw new Error(`${ref.seriesId} no devolvió observaciones en su rango de validez`)
  }

  return {
    points,
    prov: {
      seriesId: ref.seriesId,
      sourceId: ref.sourceId,
      url,
      rows: points.length,
      sha256: createHash('sha256').update(JSON.stringify(points)).digest('hex'),
    },
  }
}

/**
 * Índice de precios acumulado a partir de las variaciones mensuales, para poder
 * deflactar. La base es el primer mes disponible.
 */
function priceIndex(inflation: DataPoint[]): Map<string, number> {
  const index = new Map<string, number>()
  let level = 100
  for (const point of inflation) {
    level *= 1 + point.value / 100
    index.set(point.date.slice(0, 7), level)
  }
  return index
}

/**
 * §5.3 — indicadores calculados a partir de otros. Se resuelven acá, al tomar
 * la copia, y no en el navegador: así el dato publicado ya viene listo y el
 * cálculo queda registrado en un solo lugar.
 */
function computeIndicator(
  indicator: Indicator,
  loaded: Map<string, DataPoint[]>
): DataPoint[] {
  const spec = indicator.computed
  if (!spec) throw new Error(`${indicator.id} no declara cómo calcularse`)

  const [aId, bId] = spec.inputs
  const a = loaded.get(aId)
  const b = loaded.get(bId)
  if (!a || !b) {
    throw new Error(`faltan insumos para ${indicator.id}: se necesitan ${aId} y ${bId}`)
  }

  if (spec.op === 'brecha') {
    // Diferencia porcentual del primero sobre el segundo, por fecha común.
    const byDate = new Map(b.map((p) => [p.date, p.value]))
    return a
      .filter((p) => {
        const base = byDate.get(p.date)
        return base !== undefined && base > 0
      })
      .map((p) => ({
        date: p.date,
        value: (p.value / (byDate.get(p.date) as number) - 1) * 100,
      }))
  }

  // deflactar: se divide por el índice de precios y se expresa en base 100.
  const index = priceIndex(b)
  const deflated = a
    .map((p) => {
      const level = index.get(p.date.slice(0, 7))
      return level === undefined ? null : { date: p.date, value: p.value / level }
    })
    .filter((p): p is DataPoint => p !== null)

  if (deflated.length === 0) {
    throw new Error(`${indicator.id}: los insumos no comparten ningún período`)
  }
  const base = deflated[0].value
  return deflated.map((p) => ({ date: p.date, value: (p.value / base) * 100 }))
}

async function snapshotIndicator(indicator: Indicator, loaded: Map<string, DataPoint[]>) {
  let points: DataPoint[]
  let provenance: Provenance[]

  if (indicator.computed) {
    points = computeIndicator(indicator, loaded)
    const [aId, bId] = indicator.computed.inputs
    provenance = [
      {
        seriesId: `${indicator.computed.op}(${aId}, ${bId})`,
        sourceId: 'calculo-propio',
        url: 'https://datosgobar.github.io/series-tiempo-ar-api/',
        rows: points.length,
        sha256: createHash('sha256').update(JSON.stringify(points)).digest('hex'),
      },
    ]
  } else {
    const parts = await Promise.all(indicator.series.map(fetchRef))
    points = parts.flatMap((p) => p.points).sort((a, b) => a.date.localeCompare(b.date))
    provenance = parts.map((p) => p.prov)
  }
  loaded.set(indicator.id, points)

  const file = {
    indicatorId: indicator.id,
    label: indicator.label,
    frequency: indicator.frequency,
    unit: indicator.unit,
    fetchedAt: new Date().toISOString(),
    sourceIds: indicator.computed
      ? [...new Set(indicator.computed.inputs.flatMap((id) => {
          const dep = INDICATORS.find((i) => i.id === id)
          return dep ? dep.series.map((r) => r.sourceId) : []
        }))]
      : [...new Set(indicator.series.map((s) => s.sourceId))],
    provenance,
    points,
  }

  writeFileSync(join(OUT_DIR, `${indicator.id}.json`), JSON.stringify(file), 'utf8')
  return {
    indicatorId: indicator.id,
    rows: points.length,
    from: points[0].date,
    to: points[points.length - 1].date,
    fetchedAt: file.fetchedAt,
    organismos: file.sourceIds.map((id) => SOURCES[id].organismo),
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const only = process.argv.slice(2)
  let targets = only.length ? INDICATORS.filter((i) => only.includes(i.id)) : INDICATORS

  // Los calculados necesitan sus insumos ya cargados: se agregan si faltan y se
  // resuelven al final.
  const needed = new Set<string>()
  for (const t of targets) {
    if (t.computed) t.computed.inputs.forEach((i) => needed.add(i))
  }
  for (const id of needed) {
    if (!targets.some((t) => t.id === id)) {
      const dep = INDICATORS.find((i) => i.id === id)
      if (dep) targets = [dep, ...targets]
    }
  }
  targets = [...targets.filter((t) => !t.computed), ...targets.filter((t) => t.computed)]

  const loaded = new Map<string, DataPoint[]>()

  console.log(`Tomando copia local de ${targets.length} indicador(es)…\n`)
  const manifest = []
  const failures: string[] = []

  for (const indicator of targets) {
    process.stdout.write(`  ${indicator.id.padEnd(20)} `)
    try {
      const entry = await snapshotIndicator(indicator, loaded)
      manifest.push(entry)
      console.log(`✓ ${String(entry.rows).padStart(5)} obs  ${entry.from} → ${entry.to}`)
    } catch (err) {
      console.log(`✗ ${err instanceof Error ? err.message : String(err)}`)
      failures.push(indicator.id)
    }
  }

  if (manifest.length > 0) {
    // Una corrida parcial no puede borrar del manifiesto los indicadores que no
    // le tocaba actualizar: se fusiona con lo que ya había.
    const path = join(OUT_DIR, 'manifest.json')
    const previous: typeof manifest = existsSync(path)
      ? (JSON.parse(readFileSync(path, 'utf8')).indicators ?? [])
      : []
    const merged = new Map(previous.map((e) => [e.indicatorId, e]))
    for (const entry of manifest) merged.set(entry.indicatorId, entry)
    // Solo se conservan los indicadores que siguen en el registro.
    const alive = [...merged.values()].filter((e) =>
      INDICATORS.some((i) => i.id === e.indicatorId)
    )

    writeFileSync(
      path,
      JSON.stringify({ generatedAt: new Date().toISOString(), indicators: alive }, null, 2),
      'utf8'
    )
  }

  console.log(`\n${manifest.length} copiado(s), ${failures.length} con error.`)
  if (failures.length) {
    console.error(`Fallaron: ${failures.join(', ')}`)
    process.exit(1)
  }
}

void main()
