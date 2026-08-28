import type { DataPoint, Frequency, Indicator, IndicatorId } from '../types'

/**
 * Segmentación de series para el panel único (§8.4).
 *
 * El problema que resuelve: en un mismo panel conviven series de frecuencias
 * distintas (RF-3.33). Si se unieran todas las fechas en filas y se cortara la
 * línea en cada fecha sin dato, una serie trimestral dibujada junto a una
 * mensual desaparecería, porque tendría un hueco de cada tres fechas.
 *
 * Pero cortar nunca sería igual de incorrecto: los huecos reales tienen que
 * verse como huecos (RF-3.11, P2).
 *
 * La distinción: se conecta a través de las fechas donde la serie simplemente
 * no mide, y se corta donde falta un período que la serie debería tener.
 * Cada tramo continuo se dibuja como una línea propia.
 */

/**
 * Máximo de días entre dos observaciones consecutivas antes de considerar que
 * falta un período y cortar el trazo.
 *
 * Para las series diarias el umbral no es un día: muchas se publican solo en
 * días hábiles, así que un fin de semana largo deja tres o cuatro días sin
 * dato sin que falte nada. Cortar ahí partiría la línea en cada fin de semana.
 */
const MAX_GAP_DAYS: Record<Frequency, number> = {
  diaria: 6,
  mensual: 50,
  trimestral: 148,
  semestral: 295,
  anual: 586,
  // Cinco años: más que eso sí es una interrupción del relevamiento.
  irregular: 1830,
}

const DAY_MS = 24 * 60 * 60 * 1000

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS)
}

export interface Segment {
  indicatorId: IndicatorId
  /** dataKey único dentro del gráfico. */
  key: string
  color: string
  /** RF-3.24 — un tramo de metodología anterior se distingue del vigente. */
  dashed: boolean
  /** true en el último tramo: es el que lleva la etiqueta al final. */
  isLast: boolean
  /** Etiqueta corta para el final de la línea. */
  shortLabel: string
  points: DataPoint[]
}

/** Recorta la etiqueta para que quepa al costado del gráfico. */
function shortLabel(label: string): string {
  const clean = label.replace(/\s*·\s*/g, ' · ')
  return clean.length <= 18 ? clean : clean.slice(0, 17) + '…'
}

/**
 * Corta en dos situaciones:
 *  - falta al menos una observación esperada según la frecuencia declarada;
 *  - hay un quiebre que cambia la forma de medir, para que el tramo anterior
 *    pueda dibujarse distinto (RF-3.24).
 */
export function segmentPoints(
  points: DataPoint[],
  frequency: Frequency,
  breakDates: string[] = []
): DataPoint[][] {
  if (points.length === 0) return []

  const maxGap = MAX_GAP_DAYS[frequency]
  const segments: DataPoint[][] = []
  let current: DataPoint[] = [points[0]]

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const point = points[i]
    const gapTooBig = daysBetween(prev.date, point.date) > maxGap
    const crossesBreak = breakDates.some((d) => d > prev.date && d <= point.date)

    if (gapTooBig || crossesBreak) {
      segments.push(current)
      current = [point]
    } else {
      current.push(point)
    }
  }
  segments.push(current)
  return segments
}

/** Quiebres que cambian cómo se mide, y por lo tanto cómo se dibuja el tramo. */
const STYLE_BREAKS = new Set(['base', 'cobertura', 'organismo', 'metodologia'])

export function segmentsFor(indicator: Indicator, points: DataPoint[]): Segment[] {
  const styleBreaks = indicator.breaks
    .filter((b) => STYLE_BREAKS.has(b.kind))
    .map((b) => b.date)

  const chunks = segmentPoints(points, indicator.frequency, styleBreaks)
  // El último tramo es el de la metodología vigente: se dibuja sólido.
  const lastIndex = chunks.length - 1

  return chunks.map((chunkPoints, index) => ({
    indicatorId: indicator.id,
    key: `${indicator.id}__${index}`,
    color: indicator.color,
    dashed: index !== lastIndex,
    isLast: index === lastIndex,
    shortLabel: shortLabel(indicator.label),
    points: chunkPoints,
  }))
}

/** Milisegundos UTC de una fecha ISO, para el eje temporal del gráfico. */
export function toTime(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

/** Vuelta a fecha ISO desde el eje temporal. */
export function fromTime(t: number): string {
  return new Date(t).toISOString().slice(0, 10)
}

export type ChartRow = { date: string; t: number } & Record<
  string,
  number | string | undefined
>

/** Filas para el gráfico: una por fecha, con una clave por segmento. */
export function buildRows(segments: Segment[]): ChartRow[] {
  const byDate = new Map<string, ChartRow>()
  for (const segment of segments) {
    for (const point of segment.points) {
      const row = byDate.get(point.date) ?? {
        date: point.date,
        t: toTime(point.date),
      }
      row[segment.key] = point.value
      byDate.set(point.date, row)
    }
  }
  return [...byDate.values()].sort((a, b) => a.t - b.t)
}

/** Valor de un indicador en una fecha, para el tooltip. */
export function valueAt(segments: Segment[], indicatorId: IndicatorId, date: string): number | undefined {
  for (const segment of segments) {
    if (segment.indicatorId !== indicatorId) continue
    const hit = segment.points.find((p) => p.date === date)
    if (hit) return hit.value
  }
  return undefined
}

/** RF-3.35 — base 100 sobre el primer valor disponible de cada indicador. */
export function normalizeSegments(segments: Segment[]): Segment[] {
  const bases = new Map<IndicatorId, number>()
  const ordered = [...segments].sort((a, b) =>
    (a.points[0]?.date ?? '').localeCompare(b.points[0]?.date ?? '')
  )
  for (const segment of ordered) {
    if (bases.has(segment.indicatorId)) continue
    const first = segment.points.find((p) => p.value !== 0)
    if (first) bases.set(segment.indicatorId, first.value)
  }
  return segments.map((segment) => {
    const base = bases.get(segment.indicatorId)
    if (base === undefined) return segment
    return {
      ...segment,
      points: segment.points.map((p) => ({ date: p.date, value: (p.value / base) * 100 })),
    }
  })
}

/**
 * Marcas del eje temporal, calculadas a partir del rango visible.
 *
 * Dejar que la librería elija posiciones sobre un eje continuo produce marcas
 * en fechas arbitrarias, que al formatearse como año se repiten: «2015, 2015,
 * 2016, 2016». Acá se eligen fechas con significado —enero de cada año, o cada
 * N años según el span— y nunca hay dos etiquetas iguales.
 */
export function axisTicks(startMs: number, endMs: number): number[] {
  const startYear = new Date(startMs).getUTCFullYear()
  const endYear = new Date(endMs).getUTCFullYear()
  const years = endYear - startYear

  if (years >= 2) {
    const step = Math.max(1, Math.ceil((years + 1) / 11))
    const ticks: number[] = []
    for (let y = startYear; y <= endYear; y += step) {
      const t = Date.UTC(y, 0, 1)
      if (t >= startMs && t <= endMs) ticks.push(t)
    }
    return ticks
  }

  // Rangos cortos: una marca por mes, salteando si hay demasiados.
  const ticks: number[] = []
  const first = new Date(startMs)
  let y = first.getUTCFullYear()
  let m = first.getUTCMonth()
  while (true) {
    const t = Date.UTC(y, m, 1)
    if (t > endMs) break
    if (t >= startMs) ticks.push(t)
    m += 1
    if (m === 12) {
      m = 0
      y += 1
    }
  }
  const step = Math.ceil(ticks.length / 12)
  return step > 1 ? ticks.filter((_, i) => i % step === 0) : ticks
}
