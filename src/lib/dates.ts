/**
 * Fechas en zona horaria local (RF-4.5).
 *
 * `new Date().toISOString()` devuelve la fecha en UTC: en Argentina, después de
 * las 21:00, "hoy" pasaría a ser mañana. Estas funciones trabajan sobre los
 * componentes locales.
 */

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** Último día del mes de una fecha YYYY-MM, para un fin de rango inclusivo (RF-4.2). */
export function endOfMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number)
  // El día 0 del mes siguiente es el último del mes pedido.
  return toISODate(new Date(y, m, 0))
}

export function startOfMonth(yearMonth: string): string {
  return `${yearMonth}-01`
}

/** Resta meses a una fecha ISO, devolviendo el primer día del mes resultante. */
export function monthsAgo(months: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() - months, 1)
  return toISODate(d)
}
