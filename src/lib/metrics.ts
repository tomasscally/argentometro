import type { DataPoint, Frequency, Government, Indicator, IndicatorKind } from '../types'
import { GOVERNMENTS } from '../data/governments'

/**
 * §7 — métricas de comparación entre gestiones.
 *
 * La regla central: la métrica agregada depende del tipo de indicador (§7.1).
 * Promediar variaciones mensuales de inflación está prohibido; se acumula
 * con productoria y se anualiza.
 */

/** §7.2 — inflación acumulada: (∏(1 + rᵢ) − 1) × 100, con rᵢ en porcentaje. */
export function accumulatedRate(monthlyPercents: number[]): number {
  if (monthlyPercents.length === 0) return NaN
  const factor = monthlyPercents.reduce((acc, r) => acc * (1 + r / 100), 1)
  return (factor - 1) * 100
}

/** §7.2 — equivalente anualizada de una acumulada A (en %) sobre m meses. */
export function annualizedRate(accumulatedPercent: number, months: number): number {
  if (months <= 0) return NaN
  const factor = 1 + accumulatedPercent / 100
  if (factor <= 0) return NaN
  return (Math.pow(factor, 12 / months) - 1) * 100
}

/** §7.2 — variación punta a punta, con el primer y último dato disponible. */
export function endToEndChange(points: DataPoint[]): number {
  if (points.length < 2) return NaN
  const first = points[0].value
  const last = points[points.length - 1].value
  if (first === 0) return NaN
  return (last / first - 1) * 100
}

/** §7.2 — cambio en puntos porcentuales. */
export function percentagePointChange(points: DataPoint[]): number {
  if (points.length < 2) return NaN
  return points[points.length - 1].value - points[0].value
}

export function mean(points: DataPoint[]): number {
  if (points.length === 0) return NaN
  return points.reduce((a, p) => a + p.value, 0) / points.length
}

export function minOf(points: DataPoint[]): number {
  if (points.length === 0) return NaN
  return Math.min(...points.map((p) => p.value))
}

export function maxOf(points: DataPoint[]): number {
  if (points.length === 0) return NaN
  return Math.max(...points.map((p) => p.value))
}

/** Cantidad de meses entre dos fechas ISO, contando el mes inicial. */
export function monthSpan(startDate: string, endDate: string): number {
  const [ys, ms] = startDate.split('-').map(Number)
  const [ye, me] = endDate.split('-').map(Number)
  return (ye - ys) * 12 + (me - ms) + 1
}

/**
 * RF-6.2 — asigna puntos a una gestión usando el intervalo [inicio, fin).
 * Un punto en la fecha exacta del traspaso pertenece a la gestión entrante,
 * de modo que nunca se cuente dos veces.
 */
export function pointsForGovernment(
  points: DataPoint[],
  government: Government
): DataPoint[] {
  return points.filter(
    (p) =>
      p.date >= government.startDate &&
      (government.endDate === null || p.date < government.endDate)
  )
}

/** Observaciones por año, según la frecuencia declarada. */
const PER_YEAR: Record<Frequency, number> = {
  diaria: 365,
  mensual: 12,
  trimestral: 4,
  semestral: 2,
  anual: 1,
  // Sin cadencia fija no se puede decir cuántas observaciones "faltan".
  irregular: 0,
}

/** Días que cubre una observación, según la frecuencia declarada. */
const PERIOD_DAYS: Record<Frequency, number> = {
  diaria: 1,
  mensual: 31,
  trimestral: 92,
  semestral: 184,
  anual: 366,
  irregular: 366,
}

const DAY_MS = 24 * 60 * 60 * 1000

function addDays(date: string, days: number): string {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10)
}

/**
 * RF-6.3 — un período que abarca una transición.
 *
 * Un punto se asigna a la gestión donde cae su fecha de inicio, pero si el
 * período que representa se extiende más allá del traspaso, parte de lo que
 * mide corresponde a la gestión siguiente. Con frecuencia semestral eso puede
 * ser medio año atribuido a quien gobernó solo una parte.
 */
export function straddlesTransition(
  point: DataPoint,
  government: Government,
  frequency: Frequency
): boolean {
  if (government.endDate === null) return false
  const periodEnd = addDays(point.date, PERIOD_DAYS[frequency] - 1)
  return point.date < government.endDate && periodEnd >= government.endDate
}

export interface GovernmentMetrics {
  government: Government
  count: number
  /** Presente solo para 'tasa-flujo'. */
  accumulated?: number
  /** Presente solo para 'tasa-flujo'. */
  annualized?: number
  /** Presente solo para 'nivel'. */
  endToEnd?: number
  /** Presente solo para 'tasa-estado'. */
  ppChange?: number
  /** Presente solo para 'tasa-estado'. Promediar un nivel o un flujo no es válido. */
  average?: number
  first: number
  last: number
  min: number
  max: number
  /** L7 — la gestión en curso no es comparable con las completas. */
  ongoing: boolean
  /** RF-6.6 — la ventana de esta gestión contiene un quiebre metodológico. */
  crossesBreak: boolean
  /** RF-6.3 — cantidad de observaciones cuyo período abarca la transición. */
  straddling: number
  /**
   * Observaciones que la frecuencia declarada haría esperar para la ventana
   * efectivamente cubierta. Si faltan, la métrica acumulada está incompleta:
   * el caso concreto es el hueco del IPC de 2016, que cae dentro de una gestión.
   */
  expected: number
  missing: number
  /** El rango visible no cubre toda la gestión: la métrica es parcial. */
  clipped: boolean
}

/**
 * §7.1 — devuelve solo las métricas válidas para el tipo de indicador.
 * Las que no corresponden quedan `undefined`: no se calculan (P5).
 */
export function metricsForGovernment(
  points: DataPoint[],
  government: Government,
  kind: IndicatorKind,
  breakDates: string[] = [],
  frequency: Frequency = 'mensual',
  /** Rango efectivamente visible, para detectar métricas parciales. */
  visibleRange?: { start: string; end: string }
): GovernmentMetrics | null {
  const own = pointsForGovernment(points, government)
  // RF-6.4 — con menos de dos observaciones no se muestra en la tabla.
  if (own.length < 2) return null

  const first = own[0].value
  const last = own[own.length - 1].value
  const govEnd = government.endDate ?? own[own.length - 1].date

  const clipped =
    visibleRange !== undefined &&
    (visibleRange.start > government.startDate ||
      (government.endDate !== null && visibleRange.end < government.endDate))

  // Ventana efectivamente considerada, ya acotada por el rango visible.
  const windowStart =
    visibleRange && visibleRange.start > government.startDate
      ? visibleRange.start
      : government.startDate
  const windowEnd =
    government.endDate === null
      ? visibleRange?.end ?? own[own.length - 1].date
      : visibleRange && visibleRange.end < government.endDate
        ? visibleRange.end
        : government.endDate
  const years = Math.max(
    0,
    (Date.parse(windowEnd) - Date.parse(windowStart)) / (365.25 * DAY_MS)
  )
  const expected = Math.max(own.length, Math.round(years * PER_YEAR[frequency]))

  const base: GovernmentMetrics = {
    government,
    count: own.length,
    expected,
    missing: expected - own.length,
    first,
    last,
    min: minOf(own),
    max: maxOf(own),
    ongoing: government.endDate === null,
    crossesBreak: breakDates.some((d) => d > government.startDate && d < govEnd),
    straddling: own.filter((p) => straddlesTransition(p, government, frequency)).length,
    clipped,
  }

  switch (kind) {
    case 'tasa-flujo': {
      const accumulated = accumulatedRate(own.map((p) => p.value))
      const months = monthSpan(own[0].date, own[own.length - 1].date)
      return { ...base, accumulated, annualized: annualizedRate(accumulated, months) }
    }
    case 'nivel':
      return { ...base, endToEnd: endToEndChange(own) }
    case 'tasa-estado':
      return { ...base, ppChange: percentagePointChange(own), average: mean(own) }
  }
}

/** Tabla completa por gestión para un indicador, en orden cronológico (RF-6.7). */
export function metricsByGovernment(
  points: DataPoint[],
  indicator: Indicator,
  visibleRange?: { start: string; end: string }
): GovernmentMetrics[] {
  const breakDates = indicator.breaks.map((b) => b.date)
  return GOVERNMENTS.map((g) =>
    metricsForGovernment(
      points,
      g,
      indicator.kind,
      breakDates,
      indicator.frequency,
      visibleRange
    )
  ).filter((m): m is GovernmentMetrics => m !== null)
}

/** RF-6.4 — gestiones del rango sin observaciones suficientes, para listarlas aparte. */
export function governmentsWithoutEnoughData(
  points: DataPoint[],
  visibleRange: { start: string; end: string }
): Government[] {
  return GOVERNMENTS.filter((g) => {
    const overlaps =
      g.startDate <= visibleRange.end &&
      (g.endDate === null || g.endDate > visibleRange.start)
    return overlaps && pointsForGovernment(points, g).length < 2
  })
}
