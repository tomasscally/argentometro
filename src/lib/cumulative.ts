import type { DataPoint, Indicator } from '../types'

/**
 * Acumulado de una serie de variaciones porcentuales.
 *
 * Una serie de inflación mensual dice cuánto subieron los precios cada mes, pero
 * no cuánto subieron en total: eso no se suma, se compone. Diez por ciento en
 * enero y diez en febrero no son veinte sino veintiuno, porque el segundo diez
 * se aplica sobre un precio que ya había subido.
 *
 * El acumulado se calcula sobre el rango visible y se expresa como índice con
 * **base 100 al inicio del período que se está viendo**. Diez por ciento en
 * enero y diez en febrero llevan el índice a 121: la lectura directa es «subió
 * 21 % desde el inicio del período», que es la pregunta que uno hace mirando
 * el gráfico.
 *
 * Expresarlo como índice y no como porcentaje acumulado tiene una ventaja al
 * comparar: dos series arrancan las dos en 100, así que la distancia entre las
 * curvas se lee sin cuentas.
 */

/** Solo tiene sentido acumular lo que es una variación de un período al siguiente. */
export function isCumulable(indicator: Indicator): boolean {
  return indicator.kind === 'tasa-flujo'
}

/** Valor del índice al inicio del período. */
export const BASE = 100

/**
 * Convierte variaciones por período en un índice con base 100 al inicio de la
 * serie recibida.
 *
 * Los períodos sin dato no se cuentan: componer sobre un hueco tratándolo como
 * cero afirmaría que en esos meses no hubo variación, que es justamente lo que
 * no se sabe. La consecuencia es que el índice sobre un rango con huecos queda
 * por debajo del real, igual que la métrica acumulada de las tablas.
 */
export function toCumulative(points: DataPoint[]): DataPoint[] {
  const out: DataPoint[] = []
  let factor = 1
  for (const point of points) {
    factor *= 1 + point.value / 100
    out.push({ date: point.date, value: factor * BASE })
  }
  return out
}

export const CUMULATIVE_UNIT = 'índice base 100 al inicio del período'
