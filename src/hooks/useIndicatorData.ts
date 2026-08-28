import { useEffect, useMemo, useState } from 'react'
import type { DataPoint, DateRange, IndicatorId, SourceId } from '../types'
import { getIndicator } from '../data/indicators'
import { filterByRange, forget, loadIndicator } from '../data/seriesService'

export type LoadStatus = 'cargando' | 'con-datos' | 'sin-datos-en-rango' | 'error'

/** RF-2.1 — cuatro estados observables, y el error es uno de ellos. */
export interface IndicatorState {
  status: LoadStatus
  points: DataPoint[]
  error: string | null
  sourceIds: SourceId[]
  lastUpdated: string | null
  /** Cuándo se consultó la fuente para producir la copia local (L9, RF-2.4). */
  fetchedAt: string | null
}

const LOADING: IndicatorState = {
  status: 'cargando',
  points: [],
  error: null,
  sourceIds: [],
  lastUpdated: null,
  fetchedAt: null,
}

interface Entry {
  /** Intento al que corresponde. Un reintento invalida las entradas viejas. */
  token: number
  points: DataPoint[]
  error: string | null
  sourceIds: SourceId[]
  lastUpdated: string | null
  fetchedAt: string | null
}

/**
 * Carga una cantidad arbitraria de indicadores (RF-3.31: la selección no está
 * limitada). Un solo efecto recorre los ids pedidos, en lugar de un hook por
 * indicador: agregar uno al registro no obliga a tocar este archivo.
 *
 * La serie completa se guarda una vez y el recorte al rango visible se deriva,
 * así cambiar la ventana no vuelve a leer nada.
 *
 * RF-1.8 — la garantía es que una respuesta obsoleta nunca sobreescriba un
 * estado más nuevo, y eso lo dan el `token` y la bandera de desmontaje. No se
 * aborta la petición: la lectura está compartida entre los componentes que
 * piden el mismo indicador, y cancelarla se la cancelaría a todos.
 */
export function useIndicatorsData(
  ids: IndicatorId[],
  range: DateRange,
  reloadToken = 0
): Record<string, IndicatorState> {
  const [entries, setEntries] = useState<Partial<Record<IndicatorId, Entry>>>({})

  // Clave estable: el efecto depende del contenido de la lista, no de su identidad.
  const idsKey = [...ids].sort().join(',')

  useEffect(() => {
    let active = true
    const wanted = idsKey ? (idsKey.split(',') as IndicatorId[]) : []

    for (const id of wanted) {
      // Al reintentar se descarta lo que había: si quedó un error cacheado, el
      // botón de reintentar no serviría de nada.
      if (reloadToken > 0) forget(id)

      loadIndicator(getIndicator(id))
        .then((result) => {
          if (!active) return
          setEntries((prev) => ({
            ...prev,
            [id]: {
              token: reloadToken,
              points: result.points,
              error: null,
              sourceIds: result.sourceIds,
              lastUpdated: result.lastUpdated,
              fetchedAt: result.fetchedAt,
            },
          }))
        })
        .catch((err: unknown) => {
          if (!active) return
          // P4 — el fallo se muestra, no se degrada a otra fuente en silencio.
          setEntries((prev) => ({
            ...prev,
            [id]: {
              token: reloadToken,
              points: [],
              error: err instanceof Error ? err.message : 'Error desconocido',
              sourceIds: [],
              lastUpdated: null,
              fetchedAt: null,
            },
          }))
        })
    }

    return () => {
      active = false
    }
  }, [idsKey, reloadToken])

  return useMemo(() => {
    const out: Record<string, IndicatorState> = {}
    for (const id of ids) {
      const entry = entries[id]
      // Una entrada de un intento anterior se considera ausente: al reintentar,
      // el indicador vuelve a "cargando" sin necesidad de limpiar estado.
      if (!entry || entry.token !== reloadToken) {
        out[id] = LOADING
        continue
      }
      if (entry.error) {
        out[id] = { ...LOADING, status: 'error', error: entry.error }
        continue
      }
      const visible = filterByRange(entry.points, range.start, range.end)
      out[id] = {
        status: visible.length ? 'con-datos' : 'sin-datos-en-rango',
        points: visible,
        error: null,
        sourceIds: entry.sourceIds,
        lastUpdated: entry.lastUpdated,
        fetchedAt: entry.fetchedAt,
      }
    }
    return out
  }, [ids, entries, range.start, range.end, reloadToken])
}
