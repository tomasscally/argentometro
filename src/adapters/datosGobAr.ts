import type { DataPoint, SeriesRef } from '../types'
import { assertHostApproved, assertSourceApproved } from '../data/sources'

const BASE = 'https://apis.datos.gob.ar/series/api/series'

/**
 * Adaptador de apis.datos.gob.ar (RF-1.9).
 *
 * Notas de verificación (Anexo C):
 *  - El endpoint responde 301, hay que seguir redirecciones (fetch lo hace por defecto).
 *  - Los valores null se descartan y generan huecos (RF-1.6, P2).
 *  - `limit` topea en 5000 por respuesta; series más largas se paginan con `start`.
 *
 * No se colapsa ni se remuestrea nada: cada serie se trae con la frecuencia con
 * la que la publica la fuente (RF-1.4).
 */

/** Máximo de observaciones que la API devuelve por respuesta. */
const PAGE_SIZE = 5000

export interface DatosGobOptions {
  startDate?: string
  signal?: AbortSignal
}

/** RNF-7 — la respuesta se valida en runtime, no se castea. */
function parseResponse(raw: unknown, seriesId: string): [string, number | null][] {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`Respuesta no es un objeto para ${seriesId}`)
  }
  const body = raw as Record<string, unknown>
  if (Array.isArray(body.errors)) {
    const first = body.errors[0]
    const msg =
      typeof first === 'object' && first !== null && 'error' in first
        ? String((first as Record<string, unknown>).error)
        : 'error no especificado'
    throw new Error(`La API rechazó la consulta de ${seriesId}: ${msg}`)
  }
  if (!Array.isArray(body.data)) {
    throw new Error(`Respuesta sin campo "data" para ${seriesId}`)
  }
  const rows: [string, number | null][] = []
  for (const row of body.data) {
    if (!Array.isArray(row) || row.length < 2) {
      throw new Error(`Fila con forma inesperada en ${seriesId}`)
    }
    const [date, value] = row
    if (typeof date !== 'string') {
      throw new Error(`Fecha no textual en ${seriesId}`)
    }
    if (value !== null && typeof value !== 'number') {
      throw new Error(`Valor no numérico en ${seriesId} para ${date}`)
    }
    rows.push([date, value])
  }
  return rows
}

async function fetchPage(
  ref: SeriesRef,
  offset: number,
  options: DatosGobOptions
): Promise<[string, number | null][]> {
  const params = new URLSearchParams({
    ids: ref.seriesId,
    limit: String(PAGE_SIZE),
    start: String(offset),
    format: 'json',
  })
  if (options.startDate) params.set('start_date', options.startDate)
  // La fuente calcula la variación; no la derivamos nosotros.
  if (ref.transform) params.set('representation_mode', ref.transform)

  const url = `${BASE}?${params.toString()}`
  assertHostApproved(url)

  const response = await fetch(url, { signal: options.signal })
  if (!response.ok) {
    throw new Error(
      `apis.datos.gob.ar respondió HTTP ${response.status} para ${ref.seriesId}`
    )
  }
  return parseResponse(await response.json(), ref.seriesId)
}

export async function fetchSeries(
  ref: SeriesRef,
  options: DatosGobOptions = {}
): Promise<DataPoint[]> {
  assertSourceApproved(ref.sourceId)

  // Una serie diaria larga excede el máximo por respuesta: se pagina hasta
  // agotarla, para no truncar la serie en silencio.
  const rows: [string, number | null][] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchPage(ref, offset, options)
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  return rows
    .filter((row): row is [string, number] => row[1] !== null)
    .map(([date, value]) => ({
      date: date.substring(0, 10),
      // RF-1.5 — el escalado se aplica en la ingesta, no en la presentación.
      value: value * ref.scale,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
