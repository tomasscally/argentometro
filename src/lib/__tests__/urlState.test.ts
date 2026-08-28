import { describe, expect, it } from 'vitest'
import { decodeState, encodeState, type ViewState } from '../urlState'

const base: ViewState = {
  panels: [{ indicators: ['inflation'], normalized: false, logScale: false, adjust: 'none', cumulative: false }],
  range: { start: '2003-01-01', end: '2026-08-28' },
  governments: [],
}

describe('estado en la URL (RF-7.1)', () => {
  it('ida y vuelta reproduce la vista', () => {
    const state: ViewState = {
      panels: [
        { indicators: ['inflation', 'exchange_rate'], normalized: true, logScale: true, adjust: 'inflation', cumulative: false },
        { indicators: ['tax_revenue'], normalized: false, logScale: false, adjust: 'usd', cumulative: false },
      ],
      range: { start: '2015-12-10', end: '2019-12-09' },
      governments: ['macri'],
    }
    expect(decodeState(`#${encodeState(state)}`, base)).toEqual(state)
  })

  it('conserva varios gráficos', () => {
    const state: ViewState = {
      ...base,
      panels: [base.panels[0], { indicators: ['emae'], normalized: false, logScale: false, adjust: 'none', cumulative: false }],
    }
    const vuelta = decodeState(`#${encodeState(state)}`, base)
    expect(vuelta.panels).toHaveLength(2)
    expect(vuelta.panels[1].indicators).toEqual(['emae'])
  })

  it('conserva varias gestiones elegidas', () => {
    const state: ViewState = { ...base, governments: ['alberto-fernandez', 'milei'] }
    expect(decodeState(`#${encodeState(state)}`, base).governments).toEqual([
      'alberto-fernandez',
      'milei',
    ])
  })

  it('omite las banderas apagadas', () => {
    expect(encodeState(base)).not.toContain('g=')
  })

  it('cae al estado inicial ante un hash vacío', () => {
    expect(decodeState('', base)).toEqual(base)
  })

  it('ignora un rango inválido en vez de romperse', () => {
    expect(decodeState('#d=basura', base).range).toEqual(base.range)
    expect(decodeState('#d=2024-01-01..2020-01-01', base).range).toEqual(base.range)
  })

  it('conserva un panel vacío: el usuario puede quitar todos sus indicadores', () => {
    const panels = decodeState('#p=~~|inflation~~', base).panels
    expect(panels).toHaveLength(2)
    expect(panels[0].indicators).toEqual([])
    expect(panels[1].indicators).toEqual(['inflation'])
  })

  it('un único panel vacío también se conserva', () => {
    expect(decodeState('#p=~~', base).panels).toEqual([
      { indicators: [], normalized: false, logScale: false, adjust: 'none', cumulative: false },
    ])
  })

  it('conserva la vista acumulada', () => {
    const state: ViewState = {
      ...base,
      panels: [
        { indicators: ['inflation'], normalized: false, logScale: false, adjust: 'none', cumulative: true },
      ],
    }
    expect(decodeState(`#${encodeState(state)}`, base).panels[0].cumulative).toBe(true)
  })

  it('un panel vacío conserva sus opciones', () => {
    const state: ViewState = {
      ...base,
      panels: [{ indicators: [], normalized: true, logScale: false, adjust: 'usd', cumulative: false }],
    }
    expect(decodeState(`#${encodeState(state)}`, base).panels[0]).toEqual(state.panels[0])
  })

  it('sin parámetro de paneles cae al estado inicial', () => {
    expect(decodeState('#d=2020-01-01..2021-01-01', base).panels).toEqual(base.panels)
  })

  // Un enlace compartido sobrevive a los cambios de catálogo: getIndicator
  // lanza con un id desconocido y se llama durante el render, así que dejar
  // pasar uno dado de baja dejaría la pantalla en blanco.
  it('descarta indicadores que ya no están en el registro', () => {
    const panel = decodeState('#p=inflation,usd_blue', base).panels[0]
    expect(panel.indicators).toEqual(['inflation'])
  })

  it('un panel que solo tenía series dadas de baja queda vacío, no roto', () => {
    const panel = decodeState('#p=usd_blue,country_risk', base).panels[0]
    expect(panel.indicators).toEqual([])
  })
})
