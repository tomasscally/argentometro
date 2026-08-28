import { describe, expect, it } from 'vitest'
import type { DataPoint } from '../../types'
import { getIndicator } from '../../data/indicators'
import {
  adjustForInflation,
  adjustForUsd,
  applyAdjustment,
  buildPriceIndex,
  isAdjustable,
  whyNotAdjustable,
} from '../adjust'

const p = (date: string, value: number): DataPoint => ({ date, value })

describe('índice de precios', () => {
  it('acumula las variaciones mensuales', () => {
    const index = buildPriceIndex([p('2024-01-01', 10), p('2024-02-01', 10)])
    expect(index.get('2024-01')).toBeCloseTo(110)
    expect(index.get('2024-02')).toBeCloseTo(121)
  })
})

describe('corrección por inflación', () => {
  // Precios que se duplican: enero 100, febrero 200.
  const inflacion = [p('2024-01-01', 0), p('2024-02-01', 100)]

  it('expresa la serie en pesos del último mes', () => {
    const nominal = [p('2024-01-01', 1000), p('2024-02-01', 1000)]
    const { points, unit } = adjustForInflation(nominal, inflacion, 'pesos')

    // Con precios que se duplican, mil pesos de enero valen dos mil de febrero.
    expect(points[0].value).toBeCloseTo(2000)
    // El último mes queda igual: ya está en pesos de ese mes.
    expect(points[1].value).toBeCloseTo(1000)
    expect(unit).toBe('pesos de 2024-02')
  })

  it('una serie que crece al ritmo de la inflación queda plana', () => {
    // Es el caso que motivó la funcionalidad: la recaudación nominal sube todos
    // los meses sin que crezca en términos reales.
    const nominal = [p('2024-01-01', 1000), p('2024-02-01', 2000)]
    const { points } = adjustForInflation(nominal, inflacion, 'pesos')
    expect(points[0].value).toBeCloseTo(points[1].value)
  })

  it('deja fuera las observaciones sin inflación publicada, y lo informa', () => {
    const nominal = [p('2023-06-01', 500), p('2024-01-01', 1000)]
    const { points, note } = adjustForInflation(nominal, inflacion, 'pesos')
    expect(points).toHaveLength(1)
    expect(note).toMatch(/1 observaciones quedaron fuera/)
  })

  it('no rompe si no hay serie de inflación', () => {
    const nominal = [p('2024-01-01', 1000)]
    const { points, note } = adjustForInflation(nominal, [], 'pesos')
    expect(points).toEqual(nominal)
    expect(note).toMatch(/no hay serie de inflación/)
  })
})

describe('corrección por tipo de cambio', () => {
  const dolar = [p('2024-01-01', 800), p('2024-02-01', 1000)]

  it('divide por la cotización de cada fecha', () => {
    const { points, unit } = adjustForUsd([p('2024-01-01', 8000), p('2024-02-01', 8000)], dolar)
    expect(points[0].value).toBeCloseTo(10)
    expect(points[1].value).toBeCloseTo(8)
    expect(unit).toBe('USD')
  })

  it('usa la última cotización anterior cuando la fecha no coincide', () => {
    // El dólar es diario y la serie corregida puede ser mensual.
    const { points } = adjustForUsd([p('2024-01-15', 8000)], dolar)
    expect(points[0].value).toBeCloseTo(10)
  })

  it('deja fuera lo anterior al inicio de la serie de dólar', () => {
    const { points, note } = adjustForUsd([p('2020-01-01', 100), p('2024-01-01', 800)], dolar)
    expect(points).toHaveLength(1)
    expect(note).toMatch(/anteriores a la serie de tipo de cambio/)
  })
})

describe('qué se puede corregir', () => {
  it('una magnitud en pesos sí', () => {
    expect(isAdjustable(getIndicator('tax_revenue'))).toBe(true)
    expect(isAdjustable(getIndicator('ripte'))).toBe(true)
  })

  it('una tasa no, y explica por qué', () => {
    const desempleo = getIndicator('unemployment')
    expect(isAdjustable(desempleo)).toBe(false)
    expect(whyNotAdjustable(desempleo)).toMatch(/tasa/)
  })

  it('una variación porcentual no', () => {
    const inflacion = getIndicator('inflation')
    expect(isAdjustable(inflacion)).toBe(false)
    expect(whyNotAdjustable(inflacion)).toMatch(/variación porcentual/)
  })

  it('una serie ya en dólares no', () => {
    const reservas = getIndicator('reserves')
    expect(isAdjustable(reservas)).toBe(false)
    expect(whyNotAdjustable(reservas)).toMatch(/millones de USD/)
  })

  it('applyAdjustment deja intacta una serie que no corresponde corregir', () => {
    const desempleo = getIndicator('unemployment')
    const puntos = [p('2024-01-01', 7.5)]
    const r = applyAdjustment('inflation', desempleo, puntos, {
      inflation: [p('2024-01-01', 10)],
      exchangeRate: [],
    })
    expect(r.points).toEqual(puntos)
    expect(r.unit).toBe(desempleo.unit)
  })
})
