import { describe, expect, it } from 'vitest'
import type { DataPoint } from '../../types'
import { getIndicator } from '../../data/indicators'
import { BASE, isCumulable, toCumulative } from '../cumulative'
import { accumulatedRate } from '../metrics'

const p = (date: string, value: number): DataPoint => ({ date, value })

describe('acumulado de variaciones, en base 100', () => {
  it('compone en vez de sumar, partiendo de 100', () => {
    // El caso del enunciado: 10 % y 10 % dejan el índice en 121, no en 120.
    const acc = toCumulative([p('2024-01-01', 10), p('2024-02-01', 10)])
    expect(acc[0].value).toBeCloseTo(110)
    expect(acc[1].value).toBeCloseTo(121)
    // La lectura directa: subió 21 % desde el inicio del período.
    expect(acc[1].value - BASE).toBeCloseTo(21)
  })

  it('el inicio del período es la base', () => {
    // Un mes al 5 % deja el índice en 105: cinco por ciento sobre la base.
    expect(toCumulative([p('2024-01-01', 5)])[0].value).toBeCloseTo(105)
  })

  it('maneja variaciones negativas', () => {
    // +10 % y −10 % no se cancelan: 1,1 × 0,9 = 0,99 → índice 99.
    const acc = toCumulative([p('2024-01-01', 10), p('2024-02-01', -10)])
    expect(acc[1].value).toBeCloseTo(99)
  })

  it('doce meses al 5 % dan 179,6, no 160', () => {
    const doce = Array.from({ length: 12 }, (_, i) =>
      p(`2024-${String(i + 1).padStart(2, '0')}-01`, 5)
    )
    expect(toCumulative(doce)[11].value).toBeCloseTo(179.5856, 3)
  })

  it('coincide con la métrica acumulada de las tablas', () => {
    // Las dos responden lo mismo y no pueden diferir: si difirieran, el número
    // del gráfico y el de la tabla se contradirían.
    const valores = [3.2, -1.4, 8.7, 0, 12.1]
    const puntos = valores.map((v, i) =>
      p(`2024-${String(i + 1).padStart(2, '0')}-01`, v)
    )
    const acumulado = toCumulative(puntos)
    const ultimo = acumulado[acumulado.length - 1].value
    expect(ultimo - BASE).toBeCloseTo(accumulatedRate(valores))
  })

  it('dos series arrancan en la misma base, así se comparan directo', () => {
    const a = toCumulative([p('2024-01-01', 2), p('2024-02-01', 2)])
    const b = toCumulative([p('2024-01-01', 20), p('2024-02-01', 20)])
    expect(a[0].value).toBeCloseTo(102)
    expect(b[0].value).toBeCloseTo(120)
    // Partiendo las dos de 100, la distancia entre curvas se lee sin cuentas.
    expect(b[1].value / a[1].value).toBeGreaterThan(1.3)
  })

  it('conserva las fechas', () => {
    const acc = toCumulative([p('2024-01-01', 1), p('2024-02-01', 1)])
    expect(acc.map((x) => x.date)).toEqual(['2024-01-01', '2024-02-01'])
  })

  it('devuelve vacío sin puntos', () => {
    expect(toCumulative([])).toEqual([])
  })
})

describe('qué se puede acumular', () => {
  it('una variación porcentual sí', () => {
    expect(isCumulable(getIndicator('inflation'))).toBe(true)
    expect(isCumulable(getIndicator('inflation_core'))).toBe(true)
  })

  it('un nivel no: acumular un tipo de cambio no significa nada', () => {
    expect(isCumulable(getIndicator('exchange_rate'))).toBe(false)
    expect(isCumulable(getIndicator('tax_revenue'))).toBe(false)
  })

  it('una tasa de estado tampoco', () => {
    expect(isCumulable(getIndicator('unemployment'))).toBe(false)
    expect(isCumulable(getIndicator('poverty'))).toBe(false)
  })
})
