import type { DataPoint, Indicator } from '../types'

/**
 * Corrección de series por inflación o por tipo de cambio.
 *
 * Una serie en pesos corrientes crece por dos motivos a la vez: porque crece de
 * verdad y porque los pesos valen menos. La recaudación tributaria sube todos
 * los meses sin que eso signifique que se recaude más. Corregir separa una cosa
 * de la otra.
 *
 * Dos correcciones:
 *
 *  - **Por inflación**: la serie se expresa en pesos del último mes disponible.
 *    Un valor de 2010 se convierte en «cuántos pesos de hoy representaba».
 *  - **Por tipo de cambio**: la serie se divide por el dólar de cada fecha, y
 *    pasa a estar expresada en dólares.
 *
 * En ambos casos la unidad sigue siendo una unidad real, no un índice
 * abstracto: es más fácil de leer y no obliga a explicar una base.
 */

export type Adjustment = 'none' | 'inflation' | 'usd'

export const ADJUSTMENT_LABEL: Record<Adjustment, string> = {
  none: 'Sin corregir',
  inflation: 'Por inflación',
  usd: 'En dólares',
}

/**
 * Corregir solo tiene sentido para una magnitud en pesos corrientes. Dividir una
 * tasa, un índice o una serie ya expresada en dólares por el nivel de precios
 * no produce nada interpretable.
 */
export function isAdjustable(indicator: Indicator): boolean {
  if (indicator.kind !== 'nivel') return false
  const unit = indicator.unit.toLowerCase()
  return unit.includes('pesos') || unit.includes('ars')
}

/** Motivo por el que una serie no se puede corregir, para decirlo en la interfaz. */
export function whyNotAdjustable(indicator: Indicator): string | null {
  if (isAdjustable(indicator)) return null
  if (indicator.kind === 'tasa-flujo') {
    return 'ya es una variación porcentual'
  }
  if (indicator.kind === 'tasa-estado') {
    return 'es una tasa, no una magnitud en pesos'
  }
  return `está expresada en ${indicator.unit}, no en pesos`
}

/**
 * Índice de precios acumulado a partir de las variaciones mensuales, indexado
 * por mes. La base es arbitraria: solo importan los cocientes entre meses.
 */
export function buildPriceIndex(monthlyInflation: DataPoint[]): Map<string, number> {
  const index = new Map<string, number>()
  let level = 100
  for (const point of monthlyInflation) {
    level *= 1 + point.value / 100
    index.set(point.date.slice(0, 7), level)
  }
  return index
}

/** Último valor disponible en o antes de una fecha, para series de otra frecuencia. */
function lookupAtOrBefore(sorted: DataPoint[], date: string): number | undefined {
  let low = 0
  let high = sorted.length - 1
  let found: number | undefined
  while (low <= high) {
    const mid = (low + high) >> 1
    if (sorted[mid].date <= date) {
      found = sorted[mid].value
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return found
}

export interface AdjustResult {
  points: DataPoint[]
  /** Unidad resultante, para mostrarla en el gráfico. */
  unit: string
  /** Qué no se pudo corregir, si algo faltó. */
  note: string | null
}

/**
 * Expresa la serie en pesos del último mes del índice de precios.
 *
 * real(t) = nominal(t) × (P_último / P_t)
 */
export function adjustForInflation(
  points: DataPoint[],
  monthlyInflation: DataPoint[],
  unit: string
): AdjustResult {
  if (monthlyInflation.length === 0) {
    return { points, unit, note: 'no hay serie de inflación para corregir' }
  }
  const index = buildPriceIndex(monthlyInflation)
  const lastMonth = monthlyInflation[monthlyInflation.length - 1].date.slice(0, 7)
  const lastLevel = index.get(lastMonth)
  if (lastLevel === undefined) {
    return { points, unit, note: 'no se pudo construir el índice de precios' }
  }

  const out: DataPoint[] = []
  let sinIndice = 0
  for (const point of points) {
    const level = index.get(point.date.slice(0, 7))
    if (level === undefined || level === 0) {
      sinIndice += 1
      continue
    }
    out.push({ date: point.date, value: point.value * (lastLevel / level) })
  }

  return {
    points: out,
    unit: `${unit} de ${lastMonth}`,
    note:
      sinIndice > 0
        ? `${sinIndice} observaciones quedaron fuera: no hay inflación publicada para su mes`
        : null,
  }
}

/** Divide la serie por el tipo de cambio de cada fecha. */
export function adjustForUsd(
  points: DataPoint[],
  exchangeRate: DataPoint[]
): AdjustResult {
  if (exchangeRate.length === 0) {
    return { points, unit: 'USD', note: 'no hay serie de tipo de cambio para corregir' }
  }
  const sorted = [...exchangeRate].sort((a, b) => a.date.localeCompare(b.date))

  const out: DataPoint[] = []
  let sinCotizacion = 0
  for (const point of points) {
    const rate = lookupAtOrBefore(sorted, point.date)
    if (rate === undefined || rate === 0) {
      sinCotizacion += 1
      continue
    }
    out.push({ date: point.date, value: point.value / rate })
  }

  return {
    points: out,
    unit: 'USD',
    note:
      sinCotizacion > 0
        ? `${sinCotizacion} observaciones quedaron fuera: son anteriores a la serie de tipo de cambio`
        : null,
  }
}

export function applyAdjustment(
  adjustment: Adjustment,
  indicator: Indicator,
  points: DataPoint[],
  deflators: { inflation: DataPoint[]; exchangeRate: DataPoint[] }
): AdjustResult {
  if (adjustment === 'none' || !isAdjustable(indicator)) {
    return { points, unit: indicator.unit, note: null }
  }
  return adjustment === 'inflation'
    ? adjustForInflation(points, deflators.inflation, indicator.unit)
    : adjustForUsd(points, deflators.exchangeRate)
}
