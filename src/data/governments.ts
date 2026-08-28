import type { Government } from '../types'

/**
 * Anexo A — gestiones presidenciales y paleta.
 *
 * Colores por fuerza política (RF-6.9): celeste el peronismo, amarillo el
 * macrismo, violeta La Libertad Avanza. Las cuatro gestiones peronistas se
 * distinguen por una rampa de luminosidad cronológica, de la más clara a la
 * más oscura (RF-6.10). El color identifica, no valora.
 *
 * El intervalo es [startDate, endDate): cerrado a izquierda, abierto a
 * derecha, de modo que ningún punto caiga en dos gestiones (RF-6.2).
 */
export const GOVERNMENTS: Government[] = [
  {
    id: 'nestor-kirchner',
    name: 'Néstor Kirchner',
    shortName: 'Kirchner',
    party: 'FPV',
    startDate: '2003-05-25',
    endDate: '2007-12-10',
    color: '#9CCDEC',
  },
  {
    id: 'cfk-1',
    name: 'Cristina Fernández de Kirchner (I)',
    shortName: 'CFK I',
    party: 'FPV',
    startDate: '2007-12-10',
    endDate: '2011-12-10',
    color: '#7BB6DF',
  },
  {
    id: 'cfk-2',
    name: 'Cristina Fernández de Kirchner (II)',
    shortName: 'CFK II',
    party: 'FPV',
    startDate: '2011-12-10',
    endDate: '2015-12-10',
    color: '#559CCC',
  },
  {
    id: 'macri',
    name: 'Mauricio Macri',
    shortName: 'Macri',
    party: 'Cambiemos',
    startDate: '2015-12-10',
    endDate: '2019-12-10',
    color: '#E8B923',
  },
  {
    id: 'alberto-fernandez',
    name: 'Alberto Fernández',
    shortName: 'A. Fernández',
    party: 'FdT',
    startDate: '2019-12-10',
    endDate: '2023-12-10',
    color: '#3480B4',
  },
  {
    id: 'milei',
    name: 'Javier Milei',
    shortName: 'Milei',
    party: 'LLA',
    startDate: '2023-12-10',
    endDate: null,
    color: '#8B45B5',
  },
]

/**
 * RF-6.2 — un punto pertenece a la gestión cuya ventana [inicio, fin) lo contiene.
 * Un punto exactamente en la fecha de traspaso pertenece a la gestión entrante.
 */
export function governmentAt(date: string): Government | undefined {
  return GOVERNMENTS.find(
    (g) => date >= g.startDate && (g.endDate === null || date < g.endDate)
  )
}

/** Gestiones que se solapan con el rango dado. */
export function governmentsInRange(start: string, end: string): Government[] {
  return GOVERNMENTS.filter(
    (g) => g.startDate <= end && (g.endDate === null || g.endDate > start)
  )
}

/** L7 — la gestión en curso tiene período incompleto y debe marcarse. */
export function isOngoing(g: Government): boolean {
  return g.endDate === null
}

/**
 * Rango que cubre un conjunto de gestiones: del inicio de la más antigua al fin
 * de la más reciente.
 *
 * Si las gestiones elegidas no son contiguas —Kirchner y Milei, por ejemplo— el
 * rango incluye lo que hay en el medio. Es lo que corresponde en un eje
 * temporal: saltearlo obligaría a cortar el tiempo, y las bandas de las
 * gestiones intermedias siguen ahí para ubicarse.
 */
export function rangeForGovernments(
  ids: string[],
  today: string
): { start: string; end: string } | null {
  const selected = GOVERNMENTS.filter((g) => ids.includes(g.id))
  if (selected.length === 0) return null

  const start = selected.reduce(
    (min, g) => (g.startDate < min ? g.startDate : min),
    selected[0].startDate
  )
  const end = selected.reduce((max, g) => {
    const fin = g.endDate ?? today
    return fin > max ? fin : max
  }, selected[0].endDate ?? today)

  return { start, end }
}
