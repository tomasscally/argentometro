import type { DataPoint, Indicator, SeriesResult } from '../types'
import { fetchSnapshot, type SnapshotFile } from '../adapters/snapshot'

/**
 * Acceso a los datos de un indicador.
 *
 * La aplicación lee las copias locales publicadas con el sitio, no las APIs
 * (RF-0.6). Una vez leído, el archivo queda en memoria: cambiar el rango de
 * fechas o alternar indicadores no vuelve a pedir nada.
 */

const memory = new Map<string, SnapshotFile>()
const inFlight = new Map<string, Promise<SnapshotFile>>()

export function clearMemory(): void {
  memory.clear()
  inFlight.clear()
}

/** Descarta lo cargado de un indicador, para que el reintento vuelva a leerlo. */
export function forget(indicatorId: string): void {
  memory.delete(indicatorId)
  inFlight.delete(indicatorId)
}

export async function loadIndicator(indicator: Indicator): Promise<SeriesResult> {
  const cached = memory.get(indicator.id)
  if (cached) return toResult(cached)

  // Dos componentes que piden el mismo indicador a la vez comparten la lectura.
  let pending = inFlight.get(indicator.id)
  if (!pending) {
    pending = fetchSnapshot(indicator.id)
    inFlight.set(indicator.id, pending)
    pending
      .then((file) => memory.set(indicator.id, file))
      .catch(() => undefined)
      // Se libera para que un reintento vuelva a pedirlo, con éxito o sin él.
      .finally(() => inFlight.delete(indicator.id))
  }

  return toResult(await pending)
}

function toResult(file: SnapshotFile): SeriesResult {
  return {
    points: file.points,
    origin: 'snapshot',
    sourceIds: file.sourceIds,
    lastUpdated: file.points.length
      ? file.points[file.points.length - 1].date
      : null,
    fetchedAt: file.fetchedAt,
    provenance: file.provenance,
  }
}

/** Recorta al rango visible. El fin es inclusivo (RF-4.2). */
export function filterByRange(
  points: DataPoint[],
  start: string,
  end: string
): DataPoint[] {
  return points.filter((p) => p.date >= start && p.date <= end)
}
