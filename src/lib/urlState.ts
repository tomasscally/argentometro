import type { DateRange, IndicatorId } from '../types'
import type { Adjustment } from './adjust'

/**
 * RF-7.1 — el estado completo de la vista vive en la URL, de modo que pegarla
 * reproduce exactamente lo que se estaba viendo.
 *
 * Se usa el fragmento (`#`) y no la query para que el enlace funcione en
 * cualquier hosting estático sin configuración de rutas.
 */

export interface PanelState {
  indicators: IndicatorId[]
  normalized: boolean
  logScale: boolean
  adjust: Adjustment
  /** Muestra las variaciones porcentuales como acumulado del período. */
  cumulative: boolean
}

export interface ViewState {
  panels: PanelState[]
  range: DateRange
  /** Gestiones elegidas. Vacío significa rango libre, no «ninguna». */
  governments: string[]
}

const ADJUST_CODE: Record<Adjustment, string> = {
  none: '',
  inflation: 'i',
  usd: 'u',
}
const CODE_ADJUST: Record<string, Adjustment> = { i: 'inflation', u: 'usd' }

/** Un panel se serializa como `ids~banderas~corrección`. */
function encodePanel(panel: PanelState): string {
  const flags =
    `${panel.normalized ? 'n' : ''}` +
    `${panel.logScale ? 'l' : ''}` +
    `${panel.cumulative ? 'c' : ''}`
  return `${panel.indicators.join(',')}~${flags}~${ADJUST_CODE[panel.adjust]}`
}

/** Un panel sin indicadores es válido: el usuario puede vaciarlo. */
function decodePanel(raw: string): PanelState {
  const [ids = '', flags = '', adjust = ''] = raw.split('~')
  const indicators = ids.split(',').filter(Boolean) as IndicatorId[]
  return {
    indicators,
    normalized: flags.includes('n'),
    logScale: flags.includes('l'),
    cumulative: flags.includes('c'),
    adjust: CODE_ADJUST[adjust] ?? 'none',
  }
}

export function encodeState(state: ViewState): string {
  const params = new URLSearchParams()
  params.set('p', state.panels.map(encodePanel).join('|'))
  params.set('d', `${state.range.start}..${state.range.end}`)
  if (state.governments.length > 0) params.set('g', state.governments.join(','))
  return params.toString()
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

export function decodeState(hash: string, fallback: ViewState): ViewState {
  try {
    const params = new URLSearchParams(hash.replace(/^#/, ''))

    // `p` presente pero vacío significa un panel vacío, no la ausencia de panel.
    const rawPanels = params.get('p')
    const panels = rawPanels === null ? [] : rawPanels.split('|').map(decodePanel)

    let range = fallback.range
    const rawRange = params.get('d')
    if (rawRange) {
      const [start, end] = rawRange.split('..')
      if (ISO.test(start ?? '') && ISO.test(end ?? '') && start <= end) {
        range = { start, end }
      }
    }

    return {
      panels: panels.length ? panels : fallback.panels,
      range,
      governments: (params.get('g') ?? '').split(',').filter(Boolean),
    }
  } catch {
    // Una URL manipulada no puede romper la aplicación: se cae al estado inicial.
    return fallback
  }
}

export function readHash(fallback: ViewState): ViewState {
  if (typeof window === 'undefined') return fallback
  return decodeState(window.location.hash, fallback)
}

export function writeHash(state: ViewState): void {
  if (typeof window === 'undefined') return
  const next = `#${encodeState(state)}`
  if (window.location.hash === next) return
  // replaceState y no push: mover un control no debería llenar el historial.
  window.history.replaceState(null, '', next)
}
