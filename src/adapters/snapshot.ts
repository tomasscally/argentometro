import type { DataPoint, Frequency, IndicatorId, SourceId } from '../types'

/**
 * Lectura de las copias locales que produce `npm run snapshot`.
 *
 * La aplicación no consulta las APIs: lee estos archivos, que se publican junto
 * al sitio. Así el dato es idéntico para todos los visitantes, la carga es
 * inmediata y no depende de que las fuentes estén disponibles ni sean rápidas.
 *
 * A cambio, el dato tiene la antigüedad de la última copia, y eso la interfaz
 * lo muestra siempre (L9, RF-2.4).
 */

export interface SnapshotProvenance {
  seriesId: string
  sourceId: SourceId
  url: string
  rows: number
  sha256: string
}

export interface SnapshotFile {
  indicatorId: IndicatorId
  label: string
  frequency: Frequency
  unit: string
  /** Momento de la consulta a la fuente, ISO. */
  fetchedAt: string
  sourceIds: SourceId[]
  provenance: SnapshotProvenance[]
  points: DataPoint[]
}

/** El servidor no respondió: caída momentánea, reinicio o falta de red. */
export class SnapshotUnreachableError extends Error {
  constructor(readonly indicatorId: IndicatorId, readonly cause?: unknown) {
    super(
      `No se pudo contactar al servidor para leer "${indicatorId}". ` +
        `Puede ser una caída momentánea de la conexión.`
    )
    this.name = 'SnapshotUnreachableError'
  }
}

export class SnapshotMissingError extends Error {
  constructor(readonly indicatorId: IndicatorId) {
    super(
      `No hay copia local de "${indicatorId}". Se genera con \`npm run snapshot\` ` +
        `y se publica junto al sitio.`
    )
    this.name = 'SnapshotMissingError'
  }
}

function isDataPoint(value: unknown): value is DataPoint {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return typeof p.date === 'string' && typeof p.value === 'number'
}

/** RNF-7 / RF-0.8 — se valida la forma antes de usar el contenido. */
export function parseSnapshot(raw: unknown, indicatorId: IndicatorId): SnapshotFile {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`La copia local de "${indicatorId}" no es un objeto`)
  }
  const file = raw as Record<string, unknown>

  if (file.indicatorId !== indicatorId) {
    throw new Error(
      `La copia local dice ser de "${String(file.indicatorId)}" y se esperaba "${indicatorId}"`
    )
  }
  if (typeof file.fetchedAt !== 'string' || !file.fetchedAt) {
    throw new Error(`La copia local de "${indicatorId}" no declara cuándo se tomó`)
  }
  if (!Array.isArray(file.provenance) || file.provenance.length === 0) {
    throw new Error(`La copia local de "${indicatorId}" no tiene procedencia`)
  }
  if (!Array.isArray(file.points) || file.points.length === 0) {
    throw new Error(`La copia local de "${indicatorId}" no tiene observaciones`)
  }
  if (!file.points.every(isDataPoint)) {
    throw new Error(`La copia local de "${indicatorId}" tiene observaciones mal formadas`)
  }

  return file as unknown as SnapshotFile
}

/** Reintentos ante fallo de red. Un servidor que se reinicia no es un error del dato. */
const RETRIES = 3
const RETRY_DELAY_MS = 400

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })
}

async function readOnce(
  indicatorId: IndicatorId,
  signal?: AbortSignal
): Promise<SnapshotFile> {
  const url = `${import.meta.env.BASE_URL}data/${indicatorId}.json`

  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (err) {
    // `fetch` rechaza con TypeError cuando no llega al servidor: no distingue
    // sin red, servidor caído o reinicio del servidor de desarrollo.
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new SnapshotUnreachableError(indicatorId, err)
  }

  if (response.status === 404) throw new SnapshotMissingError(indicatorId)
  if (!response.ok) {
    throw new Error(
      `No se pudo leer la copia local de "${indicatorId}": el servidor respondió ${response.status}.`
    )
  }

  // Un servidor que devuelve el index.html ante una ruta inexistente haría que
  // JSON.parse falle con un mensaje opaco; se detecta antes.
  const text = await response.text()
  if (text.trimStart().startsWith('<')) throw new SnapshotMissingError(indicatorId)

  return parseSnapshot(JSON.parse(text), indicatorId)
}

export async function fetchSnapshot(
  indicatorId: IndicatorId,
  signal?: AbortSignal
): Promise<SnapshotFile> {
  let last: unknown
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await readOnce(indicatorId, signal)
    } catch (err) {
      // Solo se reintenta lo que puede resolverse solo. Que el archivo no exista
      // o esté mal formado no mejora reintentando.
      if (!(err instanceof SnapshotUnreachableError)) throw err
      last = err
      if (attempt < RETRIES) await wait(RETRY_DELAY_MS * attempt, signal)
    }
  }
  throw last
}
